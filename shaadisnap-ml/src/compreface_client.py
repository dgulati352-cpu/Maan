"""
ShaadiSnap AI - Exadel CompreFace Integration Client
=====================================================
Enterprise-grade, privacy-first interface for Exadel CompreFace (Apache 2.0).

Handles:
1. Face Detection & Landmark Extraction:
   Detects all faces in wedding group photos, poses, bounding boxes.
2. Subject Enrollment:
   Enrolls wedding VIPs (Bride, Groom, Parents, Close Friends, Guests).
3. Face Recognition / Search:
   Given a selfie, finds all matching wedding photos with calibrated similarity scores.
4. Biometric Privacy & Erasure (GDPR / DPDP Compliance):
   Deletes subject biometrics upon request.
"""

from typing import List, Dict, Any, Optional, Union, Tuple
import os
import io
import logging
import httpx
from PIL import Image

logger = logging.getLogger("shaadisnap_compreface")


class CompreFaceClient:
    """
    Client for Exadel CompreFace REST API.
    Supports both synchronous and asynchronous operations.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ):
        """
        :param base_url: CompreFace instance URL (default: http://localhost:8000)
        :param api_key: Recognition service API Key generated in CompreFace UI
        :param timeout: Request timeout in seconds
        """
        self.base_url = (base_url or os.getenv("COMPREFACE_URL", "http://localhost:8000")).rstrip("/")
        self.api_key = api_key or os.getenv("COMPREFACE_API_KEY", "")
        self.timeout = timeout

    @property
    def headers(self) -> Dict[str, str]:
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        return headers

    def is_configured(self) -> bool:
        """Returns True if the API key is set."""
        return bool(self.api_key and len(self.api_key) > 5)

    def check_health(self) -> Dict[str, Any]:
        """Checks if CompreFace server is reachable and active."""
        try:
            with httpx.Client(timeout=5.0) as client:
                # If API key is provided, verify recognition service status
                if self.api_key:
                    res = client.get(f"{self.base_url}/api/v1/recognition/subjects", headers=self.headers)
                    if res.status_code == 200:
                        return {"status": "ok", "url": self.base_url, "connected": True, "service_active": True}
                # Fallback to root endpoint check
                res = client.get(f"{self.base_url}/")
                if res.status_code == 200:
                    return {"status": "ok", "url": self.base_url, "connected": True, "service_active": bool(self.api_key)}
        except Exception as e:
            logger.warning(f"CompreFace health check failed: {e}")
        return {"status": "unreachable", "url": self.base_url, "connected": False, "service_active": False}

    # =========================================================================
    # 1. Detection API (/api/v1/detection/detect)
    # =========================================================================
    def detect_faces(
        self,
        image_bytes: bytes,
        limit: int = 50,
        det_prob_threshold: float = 0.8,
        face_plugins: str = "landmarks,gender,age",
    ) -> List[Dict[str, Any]]:
        """
        Detects all faces in an image using CompreFace Core.
        Returns bounding boxes, landmarks, confidence, and optional attributes.
        """
        url = f"{self.base_url}/api/v1/detection/detect"
        params = {
            "limit": limit,
            "det_prob_threshold": det_prob_threshold,
            "face_plugins": face_plugins,
        }
        files = {"file": ("image.jpg", image_bytes, "image/jpeg")}

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(url, headers=self.headers, params=params, files=files)
            if resp.status_code != 200:
                logger.error(f"CompreFace detect failed [{resp.status_code}]: {resp.text}")
                resp.raise_for_status()

            data = resp.json()
            return data.get("result", [])

    # =========================================================================
    # 2. Subject Management (/api/v1/recognition/subjects)
    # =========================================================================
    def list_subjects(self) -> List[str]:
        """Lists all enrolled subjects (guests/VIPs)."""
        url = f"{self.base_url}/api/v1/recognition/subjects"
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(url, headers=self.headers)
            if resp.status_code == 200:
                return resp.json().get("subjects", [])
            return []

    def add_subject(self, subject: str) -> bool:
        """Enrolls a new subject name (e.g., guest_id or wedding role)."""
        url = f"{self.base_url}/api/v1/recognition/subjects"
        payload = {"subject": subject}
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(url, headers=self.headers, json=payload)
            return resp.status_code in (200, 201)

    def delete_subject(self, subject: str) -> bool:
        """
        Deletes a subject and all associated biometric embeddings.
        Critical for GDPR / DPDP Article 12 Right to Erasure.
        """
        url = f"{self.base_url}/api/v1/recognition/subjects/{subject}"
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.delete(url, headers=self.headers)
            return resp.status_code in (200, 204)

    # =========================================================================
    # 3. Face Enrollment (/api/v1/recognition/faces)
    # =========================================================================
    def add_face(
        self,
        image_bytes: bytes,
        subject: str,
        det_prob_threshold: float = 0.8,
    ) -> Optional[Dict[str, Any]]:
        """
        Adds a face to a subject in the face collection.
        CompreFace extracts embeddings and indexes them.
        """
        url = f"{self.base_url}/api/v1/recognition/faces"
        params = {
            "subject": subject,
            "det_prob_threshold": det_prob_threshold,
        }
        files = {"file": ("face.jpg", image_bytes, "image/jpeg")}

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(url, headers=self.headers, params=params, files=files)
            if resp.status_code in (200, 201):
                return resp.json()
            logger.error(f"Failed to add face for subject {subject}: {resp.text}")
            return None

    # =========================================================================
    # 4. Recognition / Search (/api/v1/recognition/recognize)
    # =========================================================================
    def recognize_faces(
        self,
        image_bytes: bytes,
        limit: int = 10,
        similarity_threshold: float = 0.82,
        det_prob_threshold: float = 0.8,
        face_plugins: str = "landmarks",
    ) -> List[Dict[str, Any]]:
        """
        Given a photo (or guest selfie), identifies all enrolled subjects found.
        Returns a list of detected faces with matched subjects and similarity scores.
        """
        url = f"{self.base_url}/api/v1/recognition/recognize"
        params = {
            "limit": limit,
            "prediction_count": 5,
            "det_prob_threshold": det_prob_threshold,
            "face_plugins": face_plugins,
            "status": "true",
        }
        files = {"file": ("query.jpg", image_bytes, "image/jpeg")}

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(url, headers=self.headers, params=params, files=files)
            if resp.status_code != 200:
                logger.error(f"Recognition failed [{resp.status_code}]: {resp.text}")
                resp.raise_for_status()

            data = resp.json()
            results = data.get("result", [])
            # Filter results above similarity_threshold
            filtered = []
            for face in results:
                subjects = face.get("subjects", [])
                matching_subjects = [s for s in subjects if s.get("similarity", 0) >= similarity_threshold]
                if matching_subjects:
                    face_copy = dict(face)
                    face_copy["matched_subjects"] = matching_subjects
                    filtered.append(face_copy)
            return filtered

    # =========================================================================
    # 5. Verification API (/api/v1/verification/verify)
    # =========================================================================
    def verify(
        self,
        source_image_bytes: bytes,
        target_image_bytes: bytes,
    ) -> Dict[str, Any]:
        """
        Verifies if two face images belong to the same person.
        Returns similarity score and matching boolean.
        """
        url = f"{self.base_url}/api/v1/verification/verify"
        files = {
            "source_image": ("source.jpg", source_image_bytes, "image/jpeg"),
            "target_image": ("target.jpg", target_image_bytes, "image/jpeg"),
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(url, headers=self.headers, files=files)
            if resp.status_code == 200:
                data = resp.json().get("result", [{}])[0]
                similarity = data.get("similarity", 0.0)
                return {
                    "matched": similarity >= 0.82,
                    "similarity": similarity,
                    "box": data.get("box", {}),
                }
            return {"matched": False, "similarity": 0.0, "error": resp.text}

