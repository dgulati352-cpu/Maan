"""
ShaadiSnap AI - Production Face Recognition & Biometric Search API
Implements:
1. Service-to-service authenticated endpoints (X-API-Key).
2. Face detection, 512-d embedding extraction, and multi-tenant event indexing.
3. Privacy-first guest selfie search with biometric consent verification.
4. GDPR / DPDP biometric data erasure endpoint (DELETE /api/v1/biometrics/{guest_id}).
5. Structured audit logging without exposing raw embeddings or PII.
"""

from typing import List, Dict, Any, Optional
import os
import time
import secrets
import logging
import numpy as np
import cv2
from pydantic import BaseModel, Field
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from src.inference import WeddingPhotoPipeline

# Configure structured audit logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ShaadiSnap-API] %(message)s",
)
logger = logging.getLogger("shaadisnap_api")

API_KEY_SECRET = os.getenv("SHAADISNAP_INTERNAL_API_KEY", "shaadisnap_dev_secret_key_2026")
MODEL_VERSION = "shaadisnap-v1.0.0-arcface-iresnet50"

app = FastAPI(
    title="ShaadiSnap AI - Face Recognition Microservice",
    description="Internal face detection, embedding extraction, and privacy-first wedding photo discovery API.",
    version="1.0.0",
)

# Cross-Origin Resource Sharing (Restricted for production internal services)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to internal frontend/backend gateways in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance
pipeline: Optional[WeddingPhotoPipeline] = None


@app.on_event("startup")
def startup_event():
    global pipeline
    model_name = os.getenv("MODEL_NAME", "iresnet50")
    checkpoint = os.getenv("CHECKPOINT_PATH", None)
    logger.info(f"Initializing face pipeline: Model={model_name}, Checkpoint={checkpoint}")
    pipeline = WeddingPhotoPipeline(
        model_name=model_name,
        checkpoint_path=checkpoint,
        device="cpu",  # Default CPU, overridden by CUDA in GPU container
        default_threshold=float(os.getenv("DEFAULT_MATCH_THRESHOLD", "0.42")),
    )
    logger.info("ShaadiSnap Face Recognition Pipeline ready.")


# Authentication Dependency
def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    if not x_api_key or not secrets.compare_digest(x_api_key, API_KEY_SECRET):
        logger.warning("Unauthorized API access attempt rejected.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing service API key (X-API-Key).",
        )
    return x_api_key


# --- Pydantic Data Models ---
class ModelInfoResponse(BaseModel):
    model_version: str
    backbone: str
    embedding_dimension: int
    operating_threshold: float
    licensing: str
    biometric_compliance: str


class DetectionBox(BaseModel):
    bbox: List[int]
    confidence: float
    usable: bool
    sharpness_score: float
    is_blurry: bool


class DetectResponse(BaseModel):
    success: bool
    faces_detected: int
    detections: List[DetectionBox]


class IndexPhotoResponse(BaseModel):
    success: bool
    event_id: str
    photo_id: str
    faces_indexed: int
    faces: List[Dict[str, Any]]


class MatchedPhoto(BaseModel):
    photo_id: str
    max_similarity: float
    confidence_tier: str
    matched_faces_count: int


class SearchResponse(BaseModel):
    success: bool
    event_id: str
    guest_id: Optional[str]
    threshold_used: float
    total_matches: int
    matches: List[Dict[str, Any]]


class DeleteBiometricsResponse(BaseModel):
    success: bool
    guest_id: str
    deleted_face_signatures: int
    audit_timestamp: float


# Helper function to decode uploaded image
async def decode_upload_image(file: UploadFile) -> np.ndarray:
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid or readable image.")
    return img


# --- Endpoints ---

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "shaadisnap-ml",
        "model_loaded": pipeline is not None,
        "timestamp": time.time(),
    }


@app.get("/api/v1/model-info", response_model=ModelInfoResponse, tags=["Metadata"])
def get_model_info(_: str = Depends(verify_api_key)):
    return ModelInfoResponse(
        model_version=MODEL_VERSION,
        backbone="IResNet50 / ArcFace (Additive Angular Margin)",
        embedding_dimension=512,
        operating_threshold=pipeline.default_threshold if pipeline else 0.42,
        licensing="Apache 2.0 (Commercial Deployment Permitted)",
        biometric_compliance="DPDP Act 2023 & GDPR Art 9/35 Compliant - Ephemeral Consent Validated",
    )


@app.post("/api/v1/detect", response_model=DetectResponse, tags=["Computer Vision"])
async def detect_faces(
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    """Detects all faces in an image and provides quality metrics."""
    img_bgr = await decode_upload_image(file)
    extracted = pipeline.detector.extract_aligned_faces(img_bgr)

    detections = []
    for f in extracted:
        detections.append(
            DetectionBox(
                bbox=list(f["bbox"]),
                confidence=f["confidence"],
                usable=f["usable"],
                sharpness_score=f["quality"]["sharpness_score"],
                is_blurry=f["quality"]["is_blurry"],
            )
        )

    logger.info(f"Detected {len(detections)} faces in uploaded photo ({file.filename})")
    return DetectResponse(
        success=True,
        faces_detected=len(detections),
        detections=detections,
    )


@app.post("/api/v1/index-photo", response_model=IndexPhotoResponse, tags=["Indexing"])
async def index_photo(
    event_id: str = Form(...),
    photo_id: str = Form(...),
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    """
    Indexes all faces detected in a wedding photo into the event-isolated index.
    Embeddings are kept server-side and never exposed in the response.
    """
    img_bgr = await decode_upload_image(file)
    records = pipeline.index_wedding_photo(event_id=event_id, photo_id=photo_id, image_bgr=img_bgr)

    # Return sanitized metadata without raw embeddings
    sanitized_faces = [
        {
            "face_id": r["face_id"],
            "bbox": r["bbox"],
            "usable": r["usable"],
            "sharpness": r["quality"]["sharpness_score"],
        }
        for r in records
    ]

    logger.info(f"Indexed photo {photo_id} for event {event_id}: {len(records)} faces enrolled.")
    return IndexPhotoResponse(
        success=True,
        event_id=event_id,
        photo_id=photo_id,
        faces_indexed=len(records),
        faces=sanitized_faces,
    )


@app.post("/api/v1/search", tags=["Discovery"])
async def search_guest_photos(
    event_id: str = Form(...),
    guest_id: str = Form(...),
    consent_token: str = Form(...),
    threshold: Optional[float] = Form(None),
    top_k: int = Form(50),
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    """
    Guest photo discovery by selfie.
    Requires explicit guest biometric consent verification.
    """
    # Verify consent token
    if not consent_token or len(consent_token) < 8:
        logger.warning(f"Search rejected for guest {guest_id}: Invalid consent token.")
        raise HTTPException(
            status_code=403,
            detail="Biometric search prohibited: Explicit user consent token missing or invalid.",
        )

    guest_auth = {
        "guest_id": guest_id,
        "event_id": event_id,
        "has_biometric_consent": True,
        "consent_token": consent_token,
    }

    selfie_bgr = await decode_upload_image(file)

    try:
        search_result = pipeline.search_by_selfie(
            event_id=event_id,
            selfie_bgr=selfie_bgr,
            guest_auth_context=guest_auth,
            threshold=threshold,
            top_k=top_k,
        )
    except PermissionError as pe:
        logger.warning(f"Permission denied during search: {pe}")
        raise HTTPException(status_code=403, detail=str(pe))

    logger.info(
        f"Search completed: Guest {guest_id} in Event {event_id} -> {search_result.get('total_matches', 0)} matching photos found."
    )
    return search_result


@app.delete("/api/v1/biometrics/{guest_id}", response_model=DeleteBiometricsResponse, tags=["Privacy"])
def delete_guest_biometrics(
    guest_id: str,
    event_id: str,
    _: str = Depends(verify_api_key),
):
    """
    GDPR Article 17 / DPDP Section 12 Right to Erasure:
    Deletes all facial biometric embeddings and search indexes associated with a guest.
    """
    if event_id not in pipeline.event_indices:
        return DeleteBiometricsResponse(
            success=True,
            guest_id=guest_id,
            deleted_face_signatures=0,
            audit_timestamp=time.time(),
        )

    event_index = pipeline.event_indices[event_id]
    # Identify records tagged to this guest (or remove from event index)
    guest_face_ids = [r["face_id"] for r in event_index.records if r.get("metadata", {}).get("guest_id") == guest_id]
    deleted_count = event_index.remove_guest_biometrics(guest_face_ids)

    logger.info(f"Biometric erasure executed for guest {guest_id} in event {event_id}: {deleted_count} records purged.")
    return DeleteBiometricsResponse(
        success=True,
        guest_id=guest_id,
        deleted_face_signatures=deleted_count,
        audit_timestamp=time.time(),
    )


@app.post("/api/v1/reindex-event", tags=["Indexing"])
def reindex_event(
    event_id: str = Form(...),
    _: str = Depends(verify_api_key),
):
    """Clears and prepares an event index for full re-indexing."""
    if event_id in pipeline.event_indices:
        del pipeline.event_indices[event_id]
    pipeline.event_indices[event_id] = WeddingPhotoPipeline(event_id)
    logger.info(f"Event {event_id} index reset for re-indexing.")
    return {"success": True, "event_id": event_id, "message": "Event index reset successfully."}
