import numpy as np
import pytest
from PIL import Image

from src.detector import FaceDetector, align_face, assess_face_quality
from src.inference import WeddingPhotoPipeline, EventFaceIndex


def create_dummy_face_image(size=(200, 200), color=(210, 160, 120)):
    img = np.full((size[1], size[0], 3), color, dtype=np.uint8)
    # Draw simple eye dots
    img[70:80, 60:75] = [20, 20, 20]
    img[70:80, 125:140] = [20, 20, 20]
    # Draw simple mouth
    img[140:150, 80:120] = [150, 50, 50]
    return img


def test_detector_and_alignment():
    img_bgr = create_dummy_face_image()
    detector = FaceDetector()
    detections = detector.detect_faces(img_bgr)
    assert len(detections) >= 1

    det = detections[0]
    aligned = align_face(img_bgr, landmarks=det["landmarks"], bbox=det["bbox"], image_size=(112, 112))
    assert aligned.shape == (112, 112, 3)

    quality = assess_face_quality(aligned)
    assert "sharpness_score" in quality
    assert "mean_brightness" in quality


def test_event_indexing_and_isolation():
    index1 = EventFaceIndex(event_id="wedding_delhi_2026")
    index2 = EventFaceIndex(event_id="wedding_mumbai_2026")

    # Add dummy embeddings to index 1
    emb1 = np.random.randn(512)
    emb1 = emb1 / np.linalg.norm(emb1)
    index1.add_faces([{
        "event_id": "wedding_delhi_2026",
        "photo_id": "photo_001.jpg",
        "face_id": "f_01",
        "bbox": (10, 10, 100, 100),
        "embedding": emb1,
    }])

    # Search in index 2 (different event) must yield zero results
    matches = index2.search(query_embedding=emb1, threshold=0.30)
    assert len(matches) == 0

    # Search in index 1 must yield matching photo
    matches_delhi = index1.search(query_embedding=emb1, threshold=0.50)
    assert len(matches_delhi) == 1
    assert matches_delhi[0]["photo_id"] == "photo_001.jpg"
    assert matches_delhi[0]["similarity"] > 0.99


def test_pipeline_search_authorization_enforcement():
    pipeline = WeddingPhotoPipeline(model_name="iresnet50", device="cpu")

    # Index a photo
    img_bgr = create_dummy_face_image()
    pipeline.index_wedding_photo(
        event_id="evt_001",
        photo_id="photo_group_10.jpg",
        image_bgr=img_bgr,
    )

    # Search without consent should raise PermissionError
    guest_no_consent = {
        "guest_id": "g_123",
        "event_id": "evt_001",
        "has_biometric_consent": False,
    }
    with pytest.raises(PermissionError):
        pipeline.search_by_selfie(
            event_id="evt_001",
            selfie_bgr=img_bgr,
            guest_auth_context=guest_no_consent,
        )

    # Search with wrong event should raise PermissionError
    guest_wrong_event = {
        "guest_id": "g_123",
        "event_id": "evt_999",
        "has_biometric_consent": True,
    }
    with pytest.raises(PermissionError):
        pipeline.search_by_selfie(
            event_id="evt_001",
            selfie_bgr=img_bgr,
            guest_auth_context=guest_wrong_event,
        )

    # Search with valid consent
    guest_valid = {
        "guest_id": "g_123",
        "event_id": "evt_001",
        "has_biometric_consent": True,
    }
    res = pipeline.search_by_selfie(
        event_id="evt_001",
        selfie_bgr=img_bgr,
        guest_auth_context=guest_valid,
        threshold=0.30,
    )
    assert res["success"] is True
    assert len(res["matches"]) >= 1
    assert res["matches"][0]["photo_id"] == "photo_group_10.jpg"
