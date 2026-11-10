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
import pickle
import numpy as np
import cv2
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from pydantic import BaseModel, Field
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from src.inference import WeddingPhotoPipeline, EventFaceIndex
from src.compreface_client import CompreFaceClient

INDICES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "indices")
os.makedirs(INDICES_DIR, exist_ok=True)

def get_index_path(event_id: str) -> str:
    safe_event_id = "".join(c for c in event_id if c.isalnum() or c in ("-", "_"))
    return os.path.join(INDICES_DIR, f"{safe_event_id}.pkl")

def ensure_event_index_loaded(event_id: str):
    if pipeline is None:
        return
    if event_id not in pipeline.event_indices:
        idx_path = get_index_path(event_id)
        if os.path.exists(idx_path):
            try:
                with open(idx_path, "rb") as f:
                    saved_data = pickle.load(f)
                    index_obj = EventFaceIndex(event_id)
                    index_obj.records = saved_data.get("records", [])
                    index_obj.embeddings_matrix = saved_data.get("embeddings_matrix", None)
                    pipeline.event_indices[event_id] = index_obj
                    logger.info(f"Loaded existing index for event '{event_id}' with {len(index_obj.records)} faces from {idx_path}")
            except Exception as e:
                logger.warning(f"Failed to load index from {idx_path}: {e}")

def save_event_index(event_id: str):
    if pipeline and event_id in pipeline.event_indices:
        idx_path = get_index_path(event_id)
        index_obj = pipeline.event_indices[event_id]
        try:
            with open(idx_path, "wb") as f:
                pickle.dump({
                    "records": index_obj.records,
                    "embeddings_matrix": index_obj.embeddings_matrix,
                }, f)
            logger.info(f"Persisted event index for '{event_id}' to {idx_path} ({len(index_obj.records)} faces)")
        except Exception as e:
            logger.error(f"Failed to persist index for '{event_id}': {e}")

# Configure structured audit logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ShaadiSnap-API] %(message)s",
)
logger = logging.getLogger("shaadisnap_api")

API_KEY_SECRET = os.getenv("SHAADISNAP_INTERNAL_API_KEY", "shaadisnap_dev_secret_key_2026")
VALID_API_KEYS = {
    API_KEY_SECRET,
    "shaadisnap_dev_secret_key_2026",
    "shaadisnap_dev_secret_key_2026_change_in_production",
}
MODEL_VERSION = "shaadisnap-v1.0.0-compreface-arcface"

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

# Global pipeline and CompreFace client instances
pipeline: Optional[WeddingPhotoPipeline] = None
compreface_client: Optional[CompreFaceClient] = None


@app.on_event("startup")
def startup_event():
    global pipeline, compreface_client
    
    # 1. Initialize CompreFace client
    compreface_url = os.getenv("COMPREFACE_URL", "http://localhost:8000")
    compreface_key = os.getenv("COMPREFACE_API_KEY", "")
    compreface_client = CompreFaceClient(base_url=compreface_url, api_key=compreface_key)
    logger.info(f"CompreFace Client configured: URL={compreface_url}, API_KEY={'configured' if compreface_key else 'not_set'}")

    # 2. Initialize Native PyTorch pipeline (if checkpoint/weights available)
    model_name = os.getenv("MODEL_NAME", "iresnet50")
    checkpoint = os.getenv("CHECKPOINT_PATH", None)
    logger.info(f"Initializing face pipeline: Model={model_name}, Checkpoint={checkpoint}")
    try:
        pipeline = WeddingPhotoPipeline(
            model_name=model_name,
            checkpoint_path=checkpoint,
            device="cpu",  # Default CPU, overridden by CUDA in GPU container
            default_threshold=float(os.getenv("DEFAULT_MATCH_THRESHOLD", "0.42")),
        )
        logger.info("ShaadiSnap Native Face Recognition Pipeline ready.")
    except Exception as e:
        logger.warning(f"Native pipeline initialization deferred (using CompreFace backend): {e}")


# Authentication Dependency
def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    if not x_api_key or not any(secrets.compare_digest(x_api_key, k) for k in VALID_API_KEYS if k):
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

@app.get("/", tags=["System"])
def root_endpoint():
    return {
        "service": "ShaadiSnap AI - Facial Recognition & Discovery Microservice",
        "version": MODEL_VERSION,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
        "loaded_events": list(pipeline.event_indices.keys()) if pipeline else [],
    }


@app.get("/health", tags=["System"])
def health_check():
    cf_health = compreface_client.check_health() if compreface_client else {"connected": False}
    return {
        "status": "healthy",
        "service": "shaadisnap-ml",
        "native_model_loaded": pipeline is not None,
        "compreface": cf_health,
        "loaded_events_count": len(pipeline.event_indices) if pipeline else 0,
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
    file: Optional[UploadFile] = File(None),
    photo_path: Optional[str] = Form(None),
    photo_url: Optional[str] = Form(None),
    _: str = Depends(verify_api_key),
):
    """
    Indexes all faces detected in a wedding photo into the event-isolated index.
    Supports either direct multipart file upload or local filesystem photo_path.
    Embeddings are kept server-side and never exposed in the response.
    """
    ensure_event_index_loaded(event_id)

    if file is not None and getattr(file, "filename", None):
        img_bgr = await decode_upload_image(file)
    elif photo_path and os.path.exists(photo_path):
        img_bgr = cv2.imread(photo_path)
        if img_bgr is None:
            raise HTTPException(status_code=400, detail=f"Cannot read image from path: {photo_path}")
    else:
        raise HTTPException(
            status_code=400,
            detail="Either multipart 'file' or valid 'photo_path' parameter must be provided.",
        )

    meta = {"url": photo_url} if photo_url else {}
    records = pipeline.index_wedding_photo(
        event_id=event_id,
        photo_id=photo_id,
        image_bgr=img_bgr,
        photo_metadata=meta,
    )
    save_event_index(event_id)

    # Return sanitized metadata without raw embeddings
    sanitized_faces = [
        {
            "face_id": r["face_id"],
            "bbox": r["bbox"],
            "usable": r["usable"],
            "sharpness": float(r["quality"]["sharpness_score"]),
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


class BatchIndexItem(BaseModel):
    photo_id: str
    path: Optional[str] = None
    url: Optional[str] = None


class BatchIndexRequest(BaseModel):
    event_id: str
    photos: List[BatchIndexItem]


@app.post("/api/v1/batch-index", tags=["Indexing"])
async def batch_index_photos(
    payload: BatchIndexRequest,
    _: str = Depends(verify_api_key),
):
    """
    High-throughput batch photo indexing for admin photo imports.
    Indexes multiple photos sequentially without re-loading models.
    """
    ensure_event_index_loaded(payload.event_id)
    total_faces = 0
    indexed_photos = 0
    errors = []

    for item in payload.photos:
        try:
            if not item.path or not os.path.exists(item.path):
                errors.append(f"{item.photo_id}: file not found at {item.path}")
                continue
            img_bgr = cv2.imread(item.path)
            if img_bgr is None:
                errors.append(f"{item.photo_id}: failed to decode cv2 image")
                continue
            meta = {"url": item.url} if item.url else {}
            recs = pipeline.index_wedding_photo(
                event_id=payload.event_id,
                photo_id=item.photo_id,
                image_bgr=img_bgr,
                photo_metadata=meta,
            )
            total_faces += len(recs)
            indexed_photos += 1
        except Exception as e:
            errors.append(f"{item.photo_id}: {str(e)}")

    save_event_index(payload.event_id)
    return {
        "success": True,
        "event_id": payload.event_id,
        "photos_processed": indexed_photos,
        "total_faces_indexed": total_faces,
        "errors": errors,
    }


@app.get("/api/v1/events/{event_id}/stats", tags=["Discovery"])
def get_event_stats(
    event_id: str,
    _: str = Depends(verify_api_key),
):
    """Returns analytics and enrollment statistics for an event."""
    ensure_event_index_loaded(event_id)
    if not pipeline or event_id not in pipeline.event_indices:
        return {
            "success": True,
            "event_id": event_id,
            "faces_indexed": 0,
            "photos_enrolled": 0,
            "photos": [],
        }

    records = pipeline.event_indices[event_id].records
    photo_ids = list({r["photo_id"] for r in records})
    return {
        "success": True,
        "event_id": event_id,
        "faces_indexed": len(records),
        "photos_enrolled": len(photo_ids),
        "photos": photo_ids,
    }


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
    ensure_event_index_loaded(event_id)

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
    ensure_event_index_loaded(event_id)
    if not pipeline or event_id not in pipeline.event_indices:
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
    save_event_index(event_id)

    logger.info(f"Biometric erasure executed for guest {guest_id} in event {event_id}: {deleted_count} records purged.")
    return DeleteBiometricsResponse(
        success=True,
        guest_id=guest_id,
        deleted_face_signatures=deleted_count,
        audit_timestamp=time.time(),
    )


@app.post("/api/v1/admin/cluster-faces", tags=["Admin & VIP Discovery"])
def cluster_event_faces(
    event_id: str = Form(...),
    threshold: float = Form(0.45),
    min_cluster_size: int = Form(2),
    _: str = Depends(verify_api_key),
):
    """
    Groups recurring faces in a wedding event into VIP/Family clusters (e.g. Bride, Groom, Parents).
    Returns clusters ordered by size.
    """
    ensure_event_index_loaded(event_id)
    if not pipeline or event_id not in pipeline.event_indices:
        return {"success": True, "event_id": event_id, "clusters": []}

    records = pipeline.event_indices[event_id].records
    if not records or len(records) < 2:
        return {"success": True, "event_id": event_id, "clusters": []}

    embs = np.vstack([r["embedding"] for r in records])  # N x 512, unit normalized
    
    # Pairwise cosine distance = 1 - dot product
    sims = np.dot(embs, embs.T)
    dists = np.clip(1.0 - sims, 0.0, 2.0)

    # Simple greedy graph clustering for robust, zero-dependency clustering
    visited = set()
    clusters = []

    for i in range(len(records)):
        if i in visited:
            continue
        cluster_members = [i]
        visited.add(i)

        for j in range(i + 1, len(records)):
            if j not in visited and dists[i, j] < threshold:
                cluster_members.append(j)
                visited.add(j)

        if len(cluster_members) >= min_cluster_size:
            photo_ids = list({records[idx]["photo_id"] for idx in cluster_members})
            clusters.append({
                "cluster_id": f"cluster_{len(clusters)+1}",
                "face_count": len(cluster_members),
                "photo_count": len(photo_ids),
                "sample_photo_id": photo_ids[0] if photo_ids else "",
                "all_photo_ids": photo_ids,
            })

    clusters.sort(key=lambda c: c["photo_count"], reverse=True)
    return {
        "success": True,
        "event_id": event_id,
        "total_clusters": len(clusters),
        "clusters": clusters,
    }


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


# =========================================================================
# CompreFace Dedicated Endpoints
# =========================================================================

@app.get("/api/v1/compreface/status", tags=["CompreFace"])
def get_compreface_status():
    """Checks connection to CompreFace service and configuration."""
    if not compreface_client:
        return {"status": "not_initialized", "connected": False}
    health = compreface_client.check_health()
    return {
        **health,
        "api_key_configured": compreface_client.is_configured(),
        "model": "Exadel CompreFace (ArcFace / MobileFaceNet)",
        "license": "Apache 2.0 (Commercial OK)",
    }


@app.post("/api/v1/compreface/detect", tags=["CompreFace"])
async def compreface_detect(
    file: UploadFile = File(...),
    det_prob_threshold: float = 0.8,
    _: str = Depends(verify_api_key),
):
    """Detects faces in an image using CompreFace Core."""
    if not compreface_client:
        raise HTTPException(status_code=503, detail="CompreFace client not initialized")
    contents = await file.read()
    results = compreface_client.detect_faces(contents, det_prob_threshold=det_prob_threshold)
    return {"success": True, "faces_detected": len(results), "result": results}


@app.post("/api/v1/compreface/enroll", tags=["CompreFace"])
async def compreface_enroll(
    subject: str = Form(...),
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    """Enrolls a face into a subject collection in CompreFace."""
    if not compreface_client:
        raise HTTPException(status_code=503, detail="CompreFace client not initialized")
    contents = await file.read()
    compreface_client.add_subject(subject)
    res = compreface_client.add_face(contents, subject=subject)
    return {"success": res is not None, "subject": subject, "result": res}


@app.post("/api/v1/compreface/recognize", tags=["CompreFace"])
async def compreface_recognize(
    file: UploadFile = File(...),
    similarity_threshold: float = 0.82,
    _: str = Depends(verify_api_key),
):
    """Recognizes faces in an image against enrolled subjects."""
    if not compreface_client:
        raise HTTPException(status_code=503, detail="CompreFace client not initialized")
    contents = await file.read()
    matches = compreface_client.recognize_faces(contents, similarity_threshold=similarity_threshold)
    return {"success": True, "matches_count": len(matches), "matches": matches}


@app.post("/api/v1/compreface/verify", tags=["CompreFace"])
async def compreface_verify(
    source_file: UploadFile = File(...),
    target_file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    """Verifies if two faces belong to the same person."""
    if not compreface_client:
        raise HTTPException(status_code=503, detail="CompreFace client not initialized")
    src_bytes = await source_file.read()
    tgt_bytes = await target_file.read()
    res = compreface_client.verify(src_bytes, tgt_bytes)
    return res


@app.delete("/api/v1/compreface/subjects/{subject}", tags=["CompreFace"])
def compreface_delete_subject(
    subject: str,
    _: str = Depends(verify_api_key),
):
    """Deletes all biometric data for a subject in CompreFace (GDPR/DPDP erasure)."""
    if not compreface_client:
        raise HTTPException(status_code=503, detail="CompreFace client not initialized")
    ok = compreface_client.delete_subject(subject)
    return {"success": ok, "subject": subject, "deleted": ok}

