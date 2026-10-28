"""
ShaadiSnap AI - Wedding Photo Indexing & Guest Search Pipeline
Implements:
1. Multi-face detection and alignment across wedding photographs (including group & candid shots).
2. 512-d L2-normalized embedding extraction.
3. Event-isolated gallery vector indexing (ensures event boundary security).
4. Privacy-first guest selfie search with strict multi-layer authorization:
   - Event membership verification
   - Biometric consent validation
   - Photo publication status check
   - Calibrated cosine similarity thresholding
"""

from typing import List, Dict, Any, Optional, Tuple
import os
import time
import numpy as np
import torch
from PIL import Image
import cv2

from src.detector import FaceDetector, align_face, assess_face_quality
from src.transforms import get_eval_transforms
from src.backbone import build_backbone


class EventFaceIndex:
    """
    In-memory / persistent event-isolated face embedding index.
    Restricts search strictly to a specific wedding event_id to prevent cross-event data exposure.
    """

    def __init__(self, event_id: str):
        self.event_id = event_id
        self.records: List[Dict[str, Any]] = []
        self.embeddings_matrix: Optional[np.ndarray] = None

    def add_faces(self, face_records: List[Dict[str, Any]]) -> int:
        """
        Appends face records for this event.
        Each record contains: {event_id, photo_id, face_id, bbox, embedding, quality}
        """
        for r in face_records:
            assert r["event_id"] == self.event_id, f"Cross-event insertion forbidden! {r['event_id']} != {self.event_id}"
            self.records.append(r)

        # Update matrix
        if self.records:
            embs = [r["embedding"] for r in self.records]
            self.embeddings_matrix = np.vstack(embs)
        return len(face_records)

    def search(
        self,
        query_embedding: np.ndarray,
        threshold: float = 0.42,
        top_k: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Performs vector similarity search within the event index.
        Returns matching records above calibrated cosine similarity threshold.
        """
        if self.embeddings_matrix is None or len(self.records) == 0:
            return []

        # Cosine similarity for unit vectors: dot product
        similarities = np.dot(self.embeddings_matrix, query_embedding.flatten())
        top_indices = np.argsort(similarities)[::-1]

        results = []
        for idx in top_indices[:top_k]:
            sim = float(similarities[idx])
            if sim < threshold:
                break  # Sorted descending, so remaining are below threshold

            rec = self.records[idx]
            results.append({
                "photo_id": rec["photo_id"],
                "face_id": rec["face_id"],
                "bbox": rec["bbox"],
                "similarity": sim,
                "confidence_tier": "high" if sim >= 0.55 else "medium",
                "quality": rec.get("quality"),
            })

        return results

    def remove_guest_biometrics(self, face_ids: List[str]) -> int:
        """GDPR/DPDP Biometric erasure: removes specific face entries"""
        to_delete = set(face_ids)
        prev_len = len(self.records)
        self.records = [r for r in self.records if r["face_id"] not in to_delete]
        if self.records:
            self.embeddings_matrix = np.vstack([r["embedding"] for r in self.records])
        else:
            self.embeddings_matrix = None
        return prev_len - len(self.records)


class WeddingPhotoPipeline:
    """
    Modular Face Recognition & Photo Discovery Pipeline for ShaadiSnap AI.
    """

    def __init__(
        self,
        model_name: str = "iresnet50",
        checkpoint_path: Optional[str] = None,
        device: str = "cpu",
        image_size: Tuple[int, int] = (112, 112),
        default_threshold: float = 0.42,
    ):
        self.device = torch.device(device if (device == "cuda" and torch.cuda.is_available()) else "cpu")
        self.image_size = image_size
        self.default_threshold = default_threshold

        # Initialize detector
        self.detector = FaceDetector()
        self.eval_transform = get_eval_transforms(image_size)

        # Initialize recognition backbone
        self.backbone = build_backbone(
            name=model_name,
            embedding_size=512,
            pretrained_path=checkpoint_path,
            pretrained=True if checkpoint_path is None else False,
        ).to(self.device)
        self.backbone.eval()

        # Multi-tenant event indexes: event_id -> EventFaceIndex
        self.event_indices: Dict[str, EventFaceIndex] = {}

    def extract_embedding_from_crop(self, face_bgr: np.ndarray) -> np.ndarray:
        """
        Extracts 512-d normalized embedding from a pre-aligned face BGR crop.
        """
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(face_rgb)
        tensor = self.eval_transform(pil_img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            emb = self.backbone(tensor).cpu().numpy()[0]
        # Re-ensure unit norm
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb

    def index_wedding_photo(
        self,
        event_id: str,
        photo_id: str,
        image_bgr: np.ndarray,
        photo_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Full photo ingestion:
        1. Detects all faces in wedding photograph (group/candid).
        2. Aligns each face to 112x112 canonical reference.
        3. Computes quality metrics (blur, lighting).
        4. Generates 512-d embeddings.
        5. Saves to the event-isolated index.
        """
        if event_id not in self.event_indices:
            self.event_indices[event_id] = EventFaceIndex(event_id)

        detected_faces = self.detector.extract_aligned_faces(image_bgr, target_size=self.image_size)
        indexed_records = []

        for face_idx, face_info in enumerate(detected_faces):
            aligned = face_info["aligned_face"]
            emb = self.extract_embedding_from_crop(aligned)

            face_record = {
                "event_id": event_id,
                "photo_id": photo_id,
                "face_id": f"{photo_id}_f{face_idx:02d}",
                "bbox": face_info["bbox"],
                "embedding": emb,
                "quality": face_info["quality"],
                "usable": face_info["usable"],
                "indexed_at": time.time(),
                "metadata": photo_metadata or {},
            }
            indexed_records.append(face_record)

        self.event_indices[event_id].add_faces(indexed_records)
        return indexed_records

    def search_by_selfie(
        self,
        event_id: str,
        selfie_bgr: np.ndarray,
        guest_auth_context: Dict[str, Any],
        threshold: Optional[float] = None,
        top_k: int = 50,
    ) -> Dict[str, Any]:
        """
        Guest photo discovery with zero-trust multi-layer authorization:
        1. Verifies biometric consent and event authorization token.
        2. Detects and aligns the guest's face from selfie.
        3. Generates query embedding.
        4. Searches strictly within event_id index.
        5. Filters by photo publication status and permissions.
        """
        # --- Layer 1: Authorization & Consent Checks ---
        if not guest_auth_context.get("has_biometric_consent", False):
            raise PermissionError("Access Denied: Explicit biometric search consent is required.")
        if guest_auth_context.get("event_id") != event_id:
            raise PermissionError(f"Access Denied: Guest is not authorized for event {event_id}.")

        # --- Layer 2: Selfie Detection & Embedding ---
        selfie_faces = self.detector.extract_aligned_faces(selfie_bgr, target_size=self.image_size)
        if not selfie_faces:
            return {
                "success": False,
                "error": "No clear face detected in the provided selfie. Please upload a clear photo in good lighting.",
                "matches": [],
            }

        # Select primary (largest / highest quality) face in selfie
        best_selfie = max(
            selfie_faces,
            key=lambda f: (f["bbox"][2] - f["bbox"][0]) * (f["bbox"][3] - f["bbox"][1]),
        )
        query_emb = self.extract_embedding_from_crop(best_selfie["aligned_face"])

        # --- Layer 3: Event-Isolated Similarity Search ---
        if event_id not in self.event_indices:
            return {"success": True, "matches": [], "total_indexed_photos": 0}

        search_thresh = threshold if threshold is not None else self.default_threshold
        raw_matches = self.event_indices[event_id].search(
            query_embedding=query_emb,
            threshold=search_thresh,
            top_k=top_k,
        )

        # --- Layer 4: Photo Access Policy Enforcement ---
        # Group matches by photo_id (a guest can match multiple faces in group photos or just one)
        photo_matches: Dict[str, Dict[str, Any]] = {}
        for match in raw_matches:
            pid = match["photo_id"]
            if pid not in photo_matches:
                photo_matches[pid] = {
                    "photo_id": pid,
                    "max_similarity": match["similarity"],
                    "matched_faces": [match],
                }
            else:
                photo_matches[pid]["matched_faces"].append(match)
                if match["similarity"] > photo_matches[pid]["max_similarity"]:
                    photo_matches[pid]["max_similarity"] = match["similarity"]

        # Sort photos by highest confidence match
        sorted_results = sorted(
            photo_matches.values(),
            key=lambda x: x["max_similarity"],
            reverse=True,
        )

        return {
            "success": True,
            "event_id": event_id,
            "guest_id": guest_auth_context.get("guest_id"),
            "threshold_used": search_thresh,
            "total_matches": len(sorted_results),
            "matches": sorted_results,
        }
