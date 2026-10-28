"""
ShaadiSnap AI - Recognition Backbones (IResNet-50 / IResNet-100 / ResNet-50)
Implements:
1. Canonical IResNet (Improved ResNet with PReLU and BatchNorm) standard in ArcFace.
2. 512-dimensional L2-normalized feature representation on the unit hypersphere.
3. Modular checkpoint loading: supports PyTorch state dicts and AuraFace-compatible weights.
4. Flexible layer freezing/unfreezing for transfer learning on wedding domain data.
"""

from typing import List, Optional, Tuple, Dict, Any
import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models


def conv3x3(in_planes: int, out_planes: int, stride: int = 1, groups: int = 1, dilation: int = 1) -> nn.Conv2d:
    """3x3 convolution with padding"""
    return nn.Conv2d(
        in_planes,
        out_planes,
        kernel_size=3,
        stride=stride,
        padding=dilation,
        groups=groups,
        bias=False,
        dilation=dilation,
    )


def conv1x1(in_planes: int, out_planes: int, stride: int = 1) -> nn.Conv2d:
    """1x1 convolution"""
    return nn.Conv2d(in_planes, out_planes, kernel_size=1, stride=stride, bias=False)


class IBasicBlock(nn.Module):
    expansion = 1

    def __init__(
        self,
        inplanes: int,
        planes: int,
        stride: int = 1,
        downsample: Optional[nn.Module] = None,
        groups: int = 1,
        base_width: int = 64,
        dilation: int = 1,
    ):
        super(IBasicBlock, self).__init__()
        if groups != 1 or base_width != 64:
            raise ValueError("BasicBlock only supports groups=1 and base_width=64")
        if dilation > 1:
            raise NotImplementedError("Dilation > 1 not supported in BasicBlock")

        self.bn1 = nn.BatchNorm2d(inplanes, eps=1e-5, momentum=0.1)
        self.conv1 = conv3x3(inplanes, planes)
        self.bn2 = nn.BatchNorm2d(planes, eps=1e-5, momentum=0.1)
        self.prelu = nn.PReLU(planes)
        self.conv2 = conv3x3(planes, planes, stride)
        self.bn3 = nn.BatchNorm2d(planes, eps=1e-5, momentum=0.1)
        self.downsample = downsample
        self.stride = stride

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = x
        out = self.bn1(x)
        out = self.conv1(out)
        out = self.bn2(out)
        out = self.prelu(out)
        out = self.conv2(out)
        out = self.bn3(out)

        if self.downsample is not None:
            identity = self.downsample(x)

        out += identity
        return out


class IResNet(nn.Module):
    """
    IResNet architecture used in modern ArcFace models (e.g. AuraFace-v1, InsightFace).
    Expects aligned face tensor of shape [B, 3, 112, 112].
    Produces 512-dimensional normalized face embeddings.
    """

    def __init__(
        self,
        layers: List[int],
        dropout_prob: float = 0.4,
        embedding_size: int = 512,
        zero_init_residual: bool = False,
    ):
        super(IResNet, self).__init__()
        self.inplanes = 64
        self.dilation = 1

        self.conv1 = nn.Conv2d(
            3, self.inplanes, kernel_size=3, stride=1, padding=1, bias=False
        )
        self.bn1 = nn.BatchNorm2d(self.inplanes, eps=1e-5, momentum=0.1)
        self.prelu = nn.PReLU(self.inplanes)

        self.layer1 = self._make_layer(IBasicBlock, 64, layers[0], stride=2)
        self.layer2 = self._make_layer(IBasicBlock, 128, layers[1], stride=2)
        self.layer3 = self._make_layer(IBasicBlock, 256, layers[2], stride=2)
        self.layer4 = self._make_layer(IBasicBlock, 512, layers[3], stride=2)

        self.bn2 = nn.BatchNorm2d(512 * IBasicBlock.expansion, eps=1e-5, momentum=0.1)
        self.dropout = nn.Dropout(p=dropout_prob, inplace=True)
        # For 112x112 input: feature map after 4 downsamplings is 7x7
        self.fc = nn.Linear(512 * IBasicBlock.expansion * 7 * 7, embedding_size)
        self.features = nn.BatchNorm1d(embedding_size, eps=1e-5)
        nn.init.constant_(self.features.weight, 1.0)
        self.features.weight.requires_grad = False

        # Weight initialization
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
            elif isinstance(m, (nn.BatchNorm2d, nn.BatchNorm1d)):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)

        if zero_init_residual:
            for m in self.modules():
                if isinstance(m, IBasicBlock):
                    nn.init.constant_(m.bn3.weight, 0)

    def _make_layer(
        self,
        block: type,
        planes: int,
        blocks: int,
        stride: int = 1,
    ) -> nn.Sequential:
        downsample = None
        if stride != 1 or self.inplanes != planes * block.expansion:
            downsample = nn.Sequential(
                conv1x1(self.inplanes, planes * block.expansion, stride),
                nn.BatchNorm2d(planes * block.expansion, eps=1e-5, momentum=0.1),
            )

        layers = []
        layers.append(
            block(
                self.inplanes,
                planes,
                stride,
                downsample,
            )
        )
        self.inplanes = planes * block.expansion
        for _ in range(1, blocks):
            layers.append(block(self.inplanes, planes))

        return nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extracts 512-d normalized face embeddings.
        Input: [B, 3, 112, 112]
        Output: [B, 512] with L2 norm = 1.0
        """
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.prelu(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.bn2(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        x = self.fc(x)
        x = self.features(x)
        # Unit hypersphere normalization
        return F.normalize(x, p=2, dim=1)


class ResNet50Face(nn.Module):
    """
    Standard torchvision ResNet-50 modified for face recognition embedding.
    Commercially clean baseline with ImageNet weights.
    """

    def __init__(self, embedding_size: int = 512, pretrained: bool = False):
        super(ResNet50Face, self).__init__()
        weights = models.ResNet50_Weights.DEFAULT if pretrained else None
        base_resnet = models.resnet50(weights=weights)

        # Replace first conv if necessary, keep standard 7x7 or adapt
        self.conv1 = base_resnet.conv1
        self.bn1 = base_resnet.bn1
        self.relu = base_resnet.relu
        self.maxpool = base_resnet.maxpool

        self.layer1 = base_resnet.layer1
        self.layer2 = base_resnet.layer2
        self.layer3 = base_resnet.layer3
        self.layer4 = base_resnet.layer4

        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(2048, embedding_size)
        self.bn_features = nn.BatchNorm1d(embedding_size, eps=1e-5)
        nn.init.constant_(self.bn_features.weight, 1.0)
        self.bn_features.weight.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        x = self.bn_features(x)
        return F.normalize(x, p=2, dim=1)


def build_backbone(
    name: str = "iresnet50",
    embedding_size: int = 512,
    dropout_prob: float = 0.4,
    pretrained_path: Optional[str] = None,
    pretrained: bool = False,
) -> nn.Module:
    """
    Factory function to instantiate face recognition backbones.
    """
    name_lower = name.lower()
    if name_lower == "iresnet50":
        model = IResNet(
            layers=[3, 4, 14, 3],
            dropout_prob=dropout_prob,
            embedding_size=embedding_size,
        )
    elif name_lower == "iresnet100":
        model = IResNet(
            layers=[3, 13, 30, 3],
            dropout_prob=dropout_prob,
            embedding_size=embedding_size,
        )
    elif name_lower == "resnet50":
        model = ResNet50Face(
            embedding_size=embedding_size,
            pretrained=pretrained,
        )
    else:
        raise ValueError(f"Unknown backbone: {name}. Supported: iresnet50, iresnet100, resnet50")

    if pretrained_path and os.path.isfile(pretrained_path):
        print(f"Loading pretrained weights from: {pretrained_path}")
        state_dict = torch.load(pretrained_path, map_location="cpu")
        if "backbone_state" in state_dict:
            state_dict = state_dict["backbone_state"]
        elif "state_dict" in state_dict:
            state_dict = state_dict["state_dict"]
        # Filter matching keys
        model_dict = model.state_dict()
        filtered = {k.replace("module.", "").replace("backbone.", ""): v for k, v in state_dict.items() if k in model_dict and v.shape == model_dict[k].shape}
        model_dict.update(filtered)
        model.load_state_dict(model_dict, strict=False)
        print(f"Successfully loaded {len(filtered)} layers into {name}.")

    return model


def freeze_backbone(model: nn.Module) -> None:
    """Freezes all layers in the backbone for head-only warm up"""
    for param in model.parameters():
        param.requires_grad = False


def unfreeze_backbone(model: nn.Module, unfreeze_last_n_blocks: Optional[int] = None) -> None:
    """
    Unfreezes backbone layers.
    If unfreeze_last_n_blocks is specified (e.g. 1 or 2), unfreezes layer4 or layer3+layer4.
    Otherwise unfreezes all parameters.
    """
    if unfreeze_last_n_blocks is None:
        for param in model.parameters():
            param.requires_grad = True
    else:
        # Default: keep earlier convs frozen, unfreeze top stages
        for param in model.parameters():
            param.requires_grad = False
        if hasattr(model, "layer4"):
            for param in model.layer4.parameters():
                param.requires_grad = True
        if unfreeze_last_n_blocks >= 2 and hasattr(model, "layer3"):
            for param in model.layer3.parameters():
                param.requires_grad = True
        if hasattr(model, "fc"):
            for param in model.fc.parameters():
                param.requires_grad = True
