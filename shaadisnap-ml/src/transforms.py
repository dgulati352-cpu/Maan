"""
ShaadiSnap AI - Face Image Transforms & Wedding-Domain Augmentations
Specialized for handling variable wedding photography conditions:
- Heavy jewelry, sunglasses, dupattas, turbans (Random Occlusion)
- Dance floor and low-light motion blur (Gaussian/Motion Blur)
- Warm stage lights, golden hour, candlelight, cool strobe lights (Color Jitter)
"""

import math
import random
from typing import Tuple, Optional
import torch
import torchvision.transforms as T
import torchvision.transforms.functional as TF
from PIL import Image, ImageFilter


class RandomWeddingOcclusion:
    """
    Simulates wedding accessories that partially occlude faces:
    - Sunglasses, bindis, maang tikka (forehead jewelry)
    - Garlands, dupattas/chunni folds, floral turbans (pagri)
    """

    def __init__(self, p: float = 0.25, max_area_ratio: float = 0.15):
        self.p = p
        self.max_area_ratio = max_area_ratio

    def __call__(self, img: Image.Image) -> Image.Image:
        if random.random() > self.p:
            return img

        w, h = img.size
        # Occlusion area: between 3% and max_area_ratio of face area
        area = w * h * random.uniform(0.03, self.max_area_ratio)
        aspect = random.uniform(0.5, 2.0)
        occ_w = int(math.sqrt(area * aspect))
        occ_h = int(math.sqrt(area / aspect))
        occ_w = min(occ_w, w - 1)
        occ_h = min(occ_h, h - 1)

        x1 = random.randint(0, w - occ_w)
        y1 = random.randint(0, h - occ_h)

        # Draw solid or textured occlusion patch
        color = (
            random.randint(20, 220),
            random.randint(20, 220),
            random.randint(20, 220),
        )
        img_copy = img.copy()
        patch = Image.new("RGB", (occ_w, occ_h), color=color)
        img_copy.paste(patch, (x1, y1))
        return img_copy


class RandomWeddingMotionBlur:
    """
    Simulates motion blur common in low-light wedding candids and dance floors (Sangeet/Baraat).
    """

    def __init__(self, p: float = 0.20, max_radius: float = 1.8):
        self.p = p
        self.max_radius = max_radius

    def __call__(self, img: Image.Image) -> Image.Image:
        if random.random() > self.p:
            return img
        radius = random.uniform(0.5, self.max_radius)
        return img.filter(ImageFilter.GaussianBlur(radius=radius))


def get_train_transforms(image_size: Tuple[int, int] = (112, 112)) -> T.Compose:
    """
    Constructs the augmentation pipeline for training ArcFace models on wedding faces.
    Standard face recognition normalization: (pixel - 127.5) / 128.0 => range [-1.0, 1.0].
    """
    return T.Compose(
        [
            T.Resize(image_size, interpolation=T.InterpolationMode.BILINEAR),
            T.RandomHorizontalFlip(p=0.5),
            RandomWeddingMotionBlur(p=0.15, max_radius=1.5),
            T.ColorJitter(
                brightness=0.20,
                contrast=0.20,
                saturation=0.20,
                hue=0.05,
            ),
            RandomWeddingOcclusion(p=0.20, max_area_ratio=0.12),
            T.ToTensor(),
            # Normalizes RGB [0, 1] to [-1, 1], identical to ArcFace / InsightFace conventions
            T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
        ]
    )


def get_eval_transforms(image_size: Tuple[int, int] = (112, 112)) -> T.Compose:
    """
    Deterministic evaluation and inference transform (no augmentation).
    """
    return T.Compose(
        [
            T.Resize(image_size, interpolation=T.InterpolationMode.BILINEAR),
            T.ToTensor(),
            T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
        ]
    )


def denormalize_face(tensor: torch.Tensor) -> torch.Tensor:
    """
    Converts a normalized [-1, 1] face tensor back to [0, 1] for visualization.
    """
    return (tensor * 0.5 + 0.5).clamp(0.0, 1.0)
