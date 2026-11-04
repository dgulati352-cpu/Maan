"""
ShaadiSnap AI - CLI Facial Recognition Engine
Standalone CLI bridge for Next.js API routes:
- Fast on-demand face detection, 512-d ArcFace embedding extraction
- Event-isolated persistent indexing using local pickle storage
- Zero network/daemon dependency: runs directly via python subprocess
"""

import sys
import os
import argparse
import json
import pickle
import numpy as np
import cv2

# Add shaadisnap-ml root to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from src.inference import WeddingPhotoPipeline, EventFaceIndex
from src.detector import align_face, assess_face_quality


INDICES_DIR = os.path.join(current_dir, "data", "indices")
os.makedirs(INDICES_DIR, exist_ok=True)


def get_index_path(event_id: str) -> str:
    safe_event_id = "".join(c for c in event_id if c.isalnum() or c in ("-", "_"))
    return os.path.join(INDICES_DIR, f"{safe_event_id}.pkl")


CHECKPOINT_PATH = os.path.join(current_dir, "checkpoints", "checkpoint_best.pt")

def load_pipeline_with_index(event_id: str) -> WeddingPhotoPipeline:
    ckpt = CHECKPOINT_PATH if os.path.exists(CHECKPOINT_PATH) else None
    pipeline = WeddingPhotoPipeline(model_name="iresnet50", checkpoint_path=ckpt, device="cpu")
    idx_path = get_index_path(event_id)
    if os.path.exists(idx_path):
        try:
            with open(idx_path, "rb") as f:
                saved_data = pickle.load(f)
                index_obj = EventFaceIndex(event_id)
                index_obj.records = saved_data.get("records", [])
                index_obj.embeddings_matrix = saved_data.get("embeddings_matrix", None)
                pipeline.event_indices[event_id] = index_obj
        except Exception as e:
            sys.stderr.write(f"Warning: Failed to load index from {idx_path}: {e}\n")
    return pipeline


def save_pipeline_index(pipeline: WeddingPhotoPipeline, event_id: str):
    if event_id in pipeline.event_indices:
        idx_path = get_index_path(event_id)
        index_obj = pipeline.event_indices[event_id]
        with open(idx_path, "wb") as f:
            pickle.dump({
                "records": index_obj.records,
                "embeddings_matrix": index_obj.embeddings_matrix,
            }, f)


def cmd_index_photo(args):
    pipeline = load_pipeline_with_index(args.event)
    img_bgr = cv2.imread(args.image)
    if img_bgr is None:
        print(json.dumps({"success": False, "error": f"Could not read image file: {args.image}"}))
        return

    records = pipeline.index_wedding_photo(
        event_id=args.event,
        photo_id=args.photo_id,
        image_bgr=img_bgr,
        photo_metadata={"url": args.url} if args.url else {},
    )
    save_pipeline_index(pipeline, args.event)

    sanitized = [
        {
            "face_id": r["face_id"],
            "bbox": r["bbox"],
            "usable": r["usable"],
            "sharpness": float(r["quality"]["sharpness_score"]),
        }
        for r in records
    ]
    print(json.dumps({
        "success": True,
        "event_id": args.event,
        "photo_id": args.photo_id,
        "faces_indexed": len(records),
        "faces": sanitized,
    }))


def cmd_search_selfie(args):
    pipeline = load_pipeline_with_index(args.event)
    selfie_path = getattr(args, "selfie", None) or getattr(args, "image", None)
    if not selfie_path:
        print(json.dumps({"success": False, "error": "Missing required selfie/image path"}))
        return

    img_bgr = cv2.imread(selfie_path)
    if img_bgr is None:
        print(json.dumps({"success": False, "error": f"Could not read selfie file: {selfie_path}"}))
        return

    auth_ctx = {
        "guest_id": getattr(args, "guest_id", None) or "guest_live",
        "event_id": args.event,
        "has_biometric_consent": True,
        "consent_token": "consent_cli_verified",
    }

    result = pipeline.search_by_selfie(
        event_id=args.event,
        selfie_bgr=img_bgr,
        guest_auth_context=auth_ctx,
        threshold=args.threshold,
        top_k=args.top_k,
    )
    print(json.dumps(result))


def cmd_detect_faces(args):
    pipeline = WeddingPhotoPipeline(model_name="iresnet50", checkpoint_path=None, device="cpu")
    image_path = getattr(args, "image", None) or getattr(args, "photo", None)
    if not image_path:
        print(json.dumps({"success": False, "error": "Missing required image path"}))
        return

    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print(json.dumps({"success": False, "error": f"Could not read image: {image_path}"}))
        return

    faces = pipeline.detector.extract_aligned_faces(img_bgr)
    detections = [
        {
            "bbox": list(f["bbox"]),
            "confidence": float(f["confidence"]),
            "usable": bool(f["usable"]),
            "sharpness_score": float(f["quality"]["sharpness_score"]),
            "is_blurry": bool(f["quality"]["is_blurry"]),
        }
        for f in faces
    ]
    print(json.dumps({
        "success": True,
        "faces_detected": len(detections),
        "detections": detections,
    }))


def cmd_inspect(args):
    device = getattr(args, "device", "cpu") or "cpu"
    ckpt_exists = os.path.exists(CHECKPOINT_PATH)
    checkpoint_info = {
        "path": CHECKPOINT_PATH,
        "exists": ckpt_exists,
        "size_bytes": os.path.getsize(CHECKPOINT_PATH) if ckpt_exists else 0,
    }

    indices_info = {}
    if os.path.exists(INDICES_DIR):
        for fname in os.listdir(INDICES_DIR):
            if fname.endswith(".pkl"):
                ev_name = fname[:-4]
                fpath = os.path.join(INDICES_DIR, fname)
                try:
                    with open(fpath, "rb") as f:
                        data = pickle.load(f)
                        indices_info[ev_name] = {
                            "records_count": len(data.get("records", [])),
                            "file_size": os.path.getsize(fpath),
                        }
                except Exception:
                    indices_info[ev_name] = {"error": "unreadable"}

    res = {
        "status": "ok",
        "model": "iresnet50",
        "backbone": "iresnet50",
        "embedding_size": 512,
        "default_threshold": 0.42,
        "device": device,
        "checkpoint": checkpoint_info,
        "indices_dir": INDICES_DIR,
        "indices": indices_info,
        "total_events": len(indices_info),
    }
    print(json.dumps(res, indent=2))


def cmd_embed(args):
    device = getattr(args, "device", "cpu") or "cpu"
    ckpt = CHECKPOINT_PATH if os.path.exists(CHECKPOINT_PATH) else None
    pipeline = WeddingPhotoPipeline(model_name="iresnet50", checkpoint_path=ckpt, device=device)

    img_bgr = cv2.imread(args.image)
    if img_bgr is None:
        print(json.dumps({"success": False, "error": f"Could not read image: {args.image}"}))
        return

    faces = pipeline.detector.extract_aligned_faces(img_bgr, target_size=pipeline.image_size)
    if not faces:
        aligned = align_face(img_bgr, image_size=pipeline.image_size)
        quality = assess_face_quality(aligned)
        faces = [{
            "bbox": [0, 0, img_bgr.shape[1], img_bgr.shape[0]],
            "aligned_face": aligned,
            "quality": quality,
            "usable": quality["passes_quality"],
            "confidence": 0.8,
        }]

    primary_face = faces[0]
    embedding = pipeline.extract_embedding_from_crop(primary_face["aligned_face"])
    emb_list = [float(x) for x in embedding.tolist()]

    result = {
        "success": True,
        "image": args.image,
        "embedding_size": len(emb_list),
        "embedding": emb_list,
        "quality": {
            "sharpness_score": float(primary_face["quality"]["sharpness_score"]),
            "mean_brightness": float(primary_face["quality"]["mean_brightness"]),
            "is_blurry": bool(primary_face["quality"]["is_blurry"]),
            "passes_quality": bool(primary_face["quality"]["passes_quality"]),
        },
        "bbox": list(primary_face["bbox"]),
        "faces_detected": len(faces),
    }
    print(json.dumps(result))


def main():
    parser = argparse.ArgumentParser(description="ShaadiSnap AI Face Recognition CLI Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # index-photo
    p_index = subparsers.add_parser("index-photo")
    p_index.add_argument("--event", required=True)
    p_index.add_argument("--photo-id", required=True)
    p_index.add_argument("--image", required=True)
    p_index.add_argument("--url", default="")

    # search-selfie (with alias: match)
    p_search = subparsers.add_parser("search-selfie", aliases=["match"])
    p_search.add_argument("--event", required=True)
    p_search.add_argument("--selfie", default=None)
    p_search.add_argument("--image", default=None)
    p_search.add_argument("--guest-id", default="guest")
    p_search.add_argument("--threshold", type=float, default=0.42)
    p_search.add_argument("--top-k", type=int, default=50)

    # detect-faces (with alias: detect)
    p_detect = subparsers.add_parser("detect-faces", aliases=["detect"])
    p_detect.add_argument("--image", required=True)
    p_detect.add_argument("--photo", default=None)

    # inspect
    p_inspect = subparsers.add_parser("inspect")
    p_inspect.add_argument("--device", default="cpu")
    p_inspect.add_argument("--event", default=None)

    # embed
    p_embed = subparsers.add_parser("embed")
    p_embed.add_argument("--image", required=True)
    p_embed.add_argument("--device", default="cpu")

    args = parser.parse_args()

    if args.command == "index-photo":
        cmd_index_photo(args)
    elif args.command in ("search-selfie", "match"):
        cmd_search_selfie(args)
    elif args.command in ("detect-faces", "detect"):
        cmd_detect_faces(args)
    elif args.command == "inspect":
        cmd_inspect(args)
    elif args.command == "embed":
        cmd_embed(args)


if __name__ == "__main__":
    main()
