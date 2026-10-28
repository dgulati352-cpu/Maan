import os
import shutil
import tempfile
import pandas as pd
import pytest
from PIL import Image

from src.dataset import (
    WeddingFaceDataset,
    create_identity_disjoint_splits,
    generate_synthetic_wedding_dataset,
)


@pytest.fixture
def temp_dataset_dir():
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_synthetic_dataset_generation_and_splits(temp_dataset_dir):
    # 1. Generate synthetic dataset
    manifest_csv = generate_synthetic_wedding_dataset(
        output_dir=temp_dataset_dir,
        num_identities=10,
        images_per_identity=4,
        image_size=(112, 112),
        seed=42,
    )
    assert os.path.isfile(manifest_csv)

    df = pd.read_csv(manifest_csv)
    assert len(df) == 40
    assert len(df["identity_id"].unique()) == 10

    # 2. Partition into identity-disjoint splits
    splits = create_identity_disjoint_splits(
        full_manifest_csv=manifest_csv,
        output_dir=os.path.join(temp_dataset_dir, "splits"),
        train_ratio=0.6,
        val_ratio=0.2,
        test_ratio=0.2,
        seed=42,
    )

    df_train = pd.read_csv(splits["train_csv"])
    df_val = pd.read_csv(splits["val_csv"])
    df_test = pd.read_csv(splits["test_csv"])

    train_ids = set(df_train["identity_id"].unique())
    val_ids = set(df_val["identity_id"].unique())
    test_ids = set(df_test["identity_id"].unique())

    # CRITICAL: Verify zero identity leakage across splits
    assert train_ids.intersection(val_ids) == set()
    assert train_ids.intersection(test_ids) == set()
    assert val_ids.intersection(test_ids) == set()

    # 3. Test WeddingFaceDataset loading
    dataset = WeddingFaceDataset(splits["train_csv"])
    assert len(dataset) == len(df_train)
    assert dataset.num_classes == len(train_ids)

    img_tensor, class_idx = dataset[0]
    assert img_tensor is not None
    assert isinstance(class_idx, int)


def test_corrupted_file_handling(temp_dataset_dir):
    # Create valid image
    valid_path = os.path.join(temp_dataset_dir, "valid.jpg")
    Image.new("RGB", (112, 112), color=(100, 100, 100)).save(valid_path)

    # Create corrupt file
    corrupt_path = os.path.join(temp_dataset_dir, "corrupt.jpg")
    with open(corrupt_path, "wb") as f:
        f.write(b"NOT_A_VALID_JPEG_HEADER_CORRUPTED_FILE")

    csv_path = os.path.join(temp_dataset_dir, "test.csv")
    df = pd.DataFrame([
        {"image_path": valid_path, "identity_id": "id_1"},
        {"image_path": corrupt_path, "identity_id": "id_2"},
    ])
    df.to_csv(csv_path, index=False)

    # Dataset loader should automatically filter out the corrupted file
    dataset = WeddingFaceDataset(csv_path, validate_files=True)
    assert len(dataset) == 1
    assert dataset.samples[0][0] == valid_path
