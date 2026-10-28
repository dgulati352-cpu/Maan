import torch
import pytest
from src.backbone import build_backbone, freeze_backbone, unfreeze_backbone


def test_iresnet50_forward_and_normalization():
    model = build_backbone(name="iresnet50", embedding_size=512)
    model.eval()

    dummy_input = torch.randn(4, 3, 112, 112)
    with torch.no_grad():
        embeddings = model(dummy_input)

    assert embeddings.shape == (4, 512)
    # Check strict L2 unit hypersphere normalization
    norms = torch.norm(embeddings, p=2, dim=1)
    assert torch.allclose(norms, torch.ones_like(norms), atol=1e-5)


def test_iresnet100_forward():
    model = build_backbone(name="iresnet100", embedding_size=512)
    model.eval()

    dummy_input = torch.randn(2, 3, 112, 112)
    with torch.no_grad():
        embeddings = model(dummy_input)

    assert embeddings.shape == (2, 512)
    norms = torch.norm(embeddings, p=2, dim=1)
    assert torch.allclose(norms, torch.ones_like(norms), atol=1e-5)


def test_resnet50_face_forward():
    model = build_backbone(name="resnet50", embedding_size=512, pretrained=False)
    model.eval()

    dummy_input = torch.randn(2, 3, 112, 112)
    with torch.no_grad():
        embeddings = model(dummy_input)

    assert embeddings.shape == (2, 512)
    norms = torch.norm(embeddings, p=2, dim=1)
    assert torch.allclose(norms, torch.ones_like(norms), atol=1e-5)


def test_backbone_freezing_and_unfreezing():
    model = build_backbone(name="iresnet50", embedding_size=512)

    # Freeze all
    freeze_backbone(model)
    for p in model.parameters():
        assert not p.requires_grad

    # Unfreeze partially
    unfreeze_backbone(model, unfreeze_last_n_blocks=1)
    # Layer4 parameters should now require grad
    for p in model.layer4.parameters():
        assert p.requires_grad
    # Earlier layers (conv1) should remain frozen
    for p in model.conv1.parameters():
        assert not p.requires_grad

    # Unfreeze all
    unfreeze_backbone(model)
    for p in model.parameters():
        assert p.requires_grad
