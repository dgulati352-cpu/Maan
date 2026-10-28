import torch
import torch.nn.functional as F
import pytest
from src.arcface_head import ArcFaceHead, CosFaceHead, build_margin_head


def test_arcface_forward_shape_and_stability():
    num_classes = 50
    embedding_size = 512
    batch_size = 8

    head = ArcFaceHead(
        embedding_size=embedding_size,
        num_classes=num_classes,
        scale=64.0,
        margin=0.50,
    )

    embeddings = F.normalize(torch.randn(batch_size, embedding_size), p=2, dim=1)
    labels = torch.randint(0, num_classes, (batch_size,))

    logits = head(embeddings, labels)
    assert logits.shape == (batch_size, num_classes)
    assert not torch.isnan(logits).any(), "NaN detected in ArcFace logits"
    assert not torch.isinf(logits).any(), "Inf detected in ArcFace logits"


def test_arcface_margin_penalty_on_target_class():
    num_classes = 5
    embedding_size = 16
    head = ArcFaceHead(embedding_size=embedding_size, num_classes=num_classes, scale=64.0, margin=0.50)

    # Let embedding be identical to weight of class 0
    with torch.no_grad():
        w_norm = F.normalize(head.weight, p=2, dim=1)
        emb = w_norm[0].unsqueeze(0)  # perfect cosine similarity = 1.0 with class 0

    # With label=0, target logit should experience angular margin penalty
    # cos(0 + 0.5) = cos(0.5) ~ 0.8775 => scale * 0.8775 ~ 56.16
    # rather than scale * 1.0 = 64.0
    labels = torch.tensor([0])
    logits = head(emb, labels)

    assert logits[0, 0].item() < (64.0 - 1e-3), "Angular margin penalty was not applied to target class"


def test_cosface_forward():
    num_classes = 20
    embedding_size = 128
    batch_size = 4

    head = CosFaceHead(
        embedding_size=embedding_size,
        num_classes=num_classes,
        scale=64.0,
        margin=0.35,
    )

    embeddings = F.normalize(torch.randn(batch_size, embedding_size), p=2, dim=1)
    labels = torch.randint(0, num_classes, (batch_size,))

    logits = head(embeddings, labels)
    assert logits.shape == (batch_size, num_classes)
    assert not torch.isnan(logits).any()
