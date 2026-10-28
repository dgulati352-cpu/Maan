"""
ShaadiSnap AI - ArcFace (Additive Angular Margin) & Margin Loss Heads
Implements:
1. Exact ArcFace loss: L = -log(e^{s * cos(theta_yi + m)} / (e^{s * cos(theta_yi + m)} + sum_{j!=yi} e^{s * cos(theta_j)}))
2. Numerically stable trigonometric formulation compatible with FP16 Automatic Mixed Precision (AMP).
3. Optional CosFace (Large Margin Cosine Loss) head.
"""

import math
from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F


class ArcFaceHead(nn.Module):
    """
    ArcFace: Additive Angular Margin Loss for Deep Face Recognition (Deng et al., CVPR 2019).
    Projects normalized features and weights onto hypersphere, adding margin m directly in angular space.
    """

    def __init__(
        self,
        embedding_size: int = 512,
        num_classes: int = 100,
        scale: float = 64.0,
        margin: float = 0.50,
        easy_margin: bool = False,
    ):
        super(ArcFaceHead, self).__init__()
        self.embedding_size = embedding_size
        self.num_classes = num_classes
        self.scale = scale
        self.margin = margin
        self.easy_margin = easy_margin

        # Weight matrix: [num_classes, embedding_size]
        self.weight = nn.Parameter(torch.FloatTensor(num_classes, embedding_size))
        nn.init.xavier_uniform_(self.weight)

        # Precompute constants for angular margin
        self.cos_m = math.cos(margin)
        self.sin_m = math.sin(margin)
        self.th = math.cos(math.pi - margin)
        self.mm = math.sin(math.pi - margin) * margin

    def forward(self, embeddings: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
        """
        Args:
            embeddings: [batch_size, embedding_size] normalized embeddings
            labels: [batch_size] ground truth identity class indices

        Returns:
            logits: [batch_size, num_classes] scaled logits for CrossEntropyLoss
        """
        # Ensure unit hypersphere normalization for both weights and embeddings
        norm_embeddings = F.normalize(embeddings, p=2, dim=1)
        norm_weight = F.normalize(self.weight, p=2, dim=1)

        # cos(theta) = x^T * W_j
        cosine = F.linear(norm_embeddings, norm_weight)
        # Numerical clamp to prevent NaN in sqrt or acos during FP16 training
        cosine = cosine.clamp(-1.0 + 1e-7, 1.0 - 1e-7)

        # sin(theta) = sqrt(1 - cos^2(theta))
        sine = torch.sqrt((1.0 - torch.pow(cosine, 2)).clamp(0, 1))

        # cos(theta + m) = cos(theta)*cos(m) - sin(theta)*sin(m)
        phi = cosine * self.cos_m - sine * self.sin_m

        if self.easy_margin:
            phi = torch.where(cosine > 0, phi, cosine)
        else:
            phi = torch.where(cosine > self.th, phi, cosine - self.mm)

        # Construct one-hot mask for ground truth labels
        one_hot = torch.zeros(cosine.size(), device=embeddings.device, dtype=embeddings.dtype)
        one_hot.scatter_(1, labels.view(-1, 1).long(), 1.0)

        # Apply angular margin only to target class logit
        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)
        output = output * self.scale
        return output


class CosFaceHead(nn.Module):
    """
    CosFace: Large Margin Cosine Loss for Deep Face Recognition (Wang et al., CVPR 2018).
    Applies additive cosine margin directly: cos(theta) - m.
    """

    def __init__(
        self,
        embedding_size: int = 512,
        num_classes: int = 100,
        scale: float = 64.0,
        margin: float = 0.35,
    ):
        super(CosFaceHead, self).__init__()
        self.embedding_size = embedding_size
        self.num_classes = num_classes
        self.scale = scale
        self.margin = margin

        self.weight = nn.Parameter(torch.FloatTensor(num_classes, embedding_size))
        nn.init.xavier_uniform_(self.weight)

    def forward(self, embeddings: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
        norm_embeddings = F.normalize(embeddings, p=2, dim=1)
        norm_weight = F.normalize(self.weight, p=2, dim=1)
        cosine = F.linear(norm_embeddings, norm_weight).clamp(-1.0 + 1e-7, 1.0 - 1e-7)

        one_hot = torch.zeros(cosine.size(), device=embeddings.device, dtype=embeddings.dtype)
        one_hot.scatter_(1, labels.view(-1, 1).long(), 1.0)

        output = cosine - one_hot * self.margin
        output = output * self.scale
        return output


def build_margin_head(
    head_type: str = "arcface",
    embedding_size: int = 512,
    num_classes: int = 100,
    scale: float = 64.0,
    margin: float = 0.50,
) -> nn.Module:
    """Factory helper to build classification margin head"""
    if head_type.lower() == "arcface":
        return ArcFaceHead(
            embedding_size=embedding_size,
            num_classes=num_classes,
            scale=scale,
            margin=margin,
        )
    elif head_type.lower() == "cosface":
        return CosFaceHead(
            embedding_size=embedding_size,
            num_classes=num_classes,
            scale=scale,
            margin=margin if margin != 0.50 else 0.35,
        )
    else:
        raise ValueError(f"Unknown margin head: {head_type}. Choose 'arcface' or 'cosface'.")
