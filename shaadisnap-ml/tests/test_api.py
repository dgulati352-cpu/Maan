import io
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from api.main import app, API_KEY_SECRET


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def make_dummy_jpeg_bytes():
    img = np.full((120, 120, 3), (200, 170, 140), dtype=np.uint8)
    img[40:50, 35:45] = [20, 20, 20]
    img[40:50, 75:85] = [20, 20, 20]
    img[80:90, 50:70] = [180, 50, 50]
    _, buffer = cv2.imencode(".jpg", img)
    return buffer.tobytes()


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "shaadisnap-ml"


def test_model_info_unauthorized_and_authorized(client):
    # Without API key
    res_unauth = client.get("/api/v1/model-info")
    assert res_unauth.status_code == 401

    # With valid API key
    res_auth = client.get("/api/v1/model-info", headers={"X-API-Key": API_KEY_SECRET})
    assert res_auth.status_code == 200
    info = res_auth.json()
    assert info["embedding_dimension"] == 512
    assert "Apache 2.0" in info["licensing"]


def test_detect_faces_endpoint(client):
    jpeg_bytes = make_dummy_jpeg_bytes()
    response = client.post(
        "/api/v1/detect",
        headers={"X-API-Key": API_KEY_SECRET},
        files={"file": ("test.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["faces_detected"] >= 1


def test_index_and_search_endpoints(client):
    jpeg_bytes = make_dummy_jpeg_bytes()

    # Index photo
    index_res = client.post(
        "/api/v1/index-photo",
        headers={"X-API-Key": API_KEY_SECRET},
        data={"event_id": "test_wedding_2026", "photo_id": "candid_01.jpg"},
        files={"file": ("candid_01.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert index_res.status_code == 200
    assert index_res.json()["faces_indexed"] >= 1

    # Search with missing consent should fail with 403
    search_no_consent = client.post(
        "/api/v1/search",
        headers={"X-API-Key": API_KEY_SECRET},
        data={
            "event_id": "test_wedding_2026",
            "guest_id": "guest_42",
            "consent_token": "",  # Empty consent token
        },
        files={"file": ("selfie.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert search_no_consent.status_code == 403

    # Search with valid consent
    search_valid = client.post(
        "/api/v1/search",
        headers={"X-API-Key": API_KEY_SECRET},
        data={
            "event_id": "test_wedding_2026",
            "guest_id": "guest_42",
            "consent_token": "consent_tok_valid_9988",
            "threshold": "0.30",
        },
        files={"file": ("selfie.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert search_valid.status_code == 200
    search_data = search_valid.json()
    assert search_data["success"] is True
    assert search_data["total_matches"] >= 1
    assert search_data["matches"][0]["photo_id"] == "candid_01.jpg"

    # GDPR Biometric deletion endpoint
    del_res = client.delete(
        "/api/v1/biometrics/guest_42?event_id=test_wedding_2026",
        headers={"X-API-Key": API_KEY_SECRET},
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
