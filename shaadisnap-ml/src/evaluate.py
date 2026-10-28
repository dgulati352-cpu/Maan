"""
ShaadiSnap AI - Evaluation Pipeline & Biometric Verification Metrics
Implements:
1. False Match Rate (FMR) & False Non-Match Rate (FNMR) computation.
2. Receiver Operating Characteristic (ROC) curve, AUC, and Equal Error Rate (EER).
3. Operating threshold selection at target FMR (e.g., FMR = 0.001 / 0.1%).
4. Photo retrieval metrics: Precision@K and Recall@K.
5. Latency, throughput, and memory profiling.
"""

from typing import List, Tuple, Dict, Any, Optional
import time
import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import roc_curve, auc


def extract_embeddings_from_loader(
    model: torch.nn.Module,
    dataloader: torch.utils.data.DataLoader,
    device: torch.device,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Passes dataloader batches through model to extract 512-d normalized embeddings.
    Returns:
        embeddings: np.ndarray [N, 512]
        labels: np.ndarray [N]
    """
    model.eval()
    all_embeddings = []
    all_labels = []

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            feats = model(images)
            all_embeddings.append(feats.cpu().numpy())
            all_labels.append(labels.numpy())

    embeddings = np.vstack(all_embeddings)
    labels = np.concatenate(all_labels)
    # Ensure strict L2 unit norm
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / np.maximum(norms, 1e-12)
    return embeddings, labels


def generate_verification_pairs(
    embeddings: np.ndarray,
    labels: np.ndarray,
    num_genuine: int = 1000,
    num_impostor: int = 3000,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Generates genuine (same identity) and impostor (different identity) pairs.
    Returns:
        emb_pairs1, emb_pairs2, pair_labels (1 for genuine, 0 for impostor), similarities
    """
    np.random.seed(seed)
    unique_labels = np.unique(labels)
    label_to_indices = {lbl: np.where(labels == lbl)[0] for lbl in unique_labels}

    # Filter identities with at least 2 samples for genuine pairs
    valid_genuine_labels = [lbl for lbl, idxs in label_to_indices.items() if len(idxs) >= 2]
    if not valid_genuine_labels:
        raise ValueError("Cannot form genuine pairs: no identity has >= 2 samples.")

    genuine_pairs_idx = []
    for _ in range(num_genuine):
        lbl = np.random.choice(valid_genuine_labels)
        idx1, idx2 = np.random.choice(label_to_indices[lbl], size=2, replace=False)
        genuine_pairs_idx.append((idx1, idx2))

    impostor_pairs_idx = []
    for _ in range(num_impostor):
        lbl1, lbl2 = np.random.choice(unique_labels, size=2, replace=False)
        idx1 = np.random.choice(label_to_indices[lbl1])
        idx2 = np.random.choice(label_to_indices[lbl2])
        impostor_pairs_idx.append((idx1, idx2))

    all_pairs = genuine_pairs_idx + impostor_pairs_idx
    pair_labels = np.array([1] * len(genuine_pairs_idx) + [0] * len(impostor_pairs_idx))

    idx1_list = [p[0] for p in all_pairs]
    idx2_list = [p[1] for p in all_pairs]

    embs1 = embeddings[idx1_list]
    embs2 = embeddings[idx2_list]

    # Cosine similarity for unit-normalized vectors is the dot product
    similarities = np.sum(embs1 * embs2, axis=1)

    return embs1, embs2, pair_labels, similarities


def compute_biometric_metrics(
    pair_labels: np.ndarray,
    similarities: np.ndarray,
    target_fmr: float = 0.001,
) -> Dict[str, Any]:
    """
    Computes standard biometric verification performance:
    - ROC Curve & AUC
    - Equal Error Rate (EER) and operating threshold
    - Operating threshold at target False Match Rate (FMR)
    - False Non-Match Rate (FNMR) at target FMR
    """
    fpr, tpr, thresholds = roc_curve(pair_labels, similarities)
    roc_auc = float(auc(fpr, tpr))
    fnr = 1.0 - tpr

    # Equal Error Rate: point where FMR == FNMR (FPR == FNR)
    eer_idx = int(np.nanargmin(np.abs(fpr - fnr)))
    eer = float((fpr[eer_idx] + fnr[eer_idx]) / 2.0)
    eer_threshold = float(thresholds[eer_idx])

    # Threshold at target FMR (e.g., FMR = 0.001 => FPR <= 0.001)
    fmr_idx = np.where(fpr <= target_fmr)[0]
    if len(fmr_idx) > 0:
        opt_idx = fmr_idx[-1]  # Highest threshold satisfying condition
        calibrated_threshold = float(thresholds[opt_idx])
        fnmr_at_target_fmr = float(fnr[opt_idx])
        actual_fmr = float(fpr[opt_idx])
    else:
        # If dataset size cannot support 1/1000 resolution, select minimum available FPR
        opt_idx = 0
        calibrated_threshold = float(thresholds[0])
        fnmr_at_target_fmr = float(fnr[0])
        actual_fmr = float(fpr[0])

    genuine_scores = similarities[pair_labels == 1]
    impostor_scores = similarities[pair_labels == 0]

    return {
        "roc_auc": roc_auc,
        "eer": eer,
        "eer_threshold": eer_threshold,
        "target_fmr": target_fmr,
        "actual_fmr": actual_fmr,
        "fnmr_at_target_fmr": fnmr_at_target_fmr,
        "calibrated_threshold": calibrated_threshold,
        "genuine_mean_sim": float(np.mean(genuine_scores)),
        "genuine_std_sim": float(np.std(genuine_scores)),
        "impostor_mean_sim": float(np.mean(impostor_scores)),
        "impostor_std_sim": float(np.std(impostor_scores)),
        "fpr": fpr.tolist(),
        "tpr": tpr.tolist(),
        "thresholds": thresholds.tolist(),
    }


def compute_retrieval_metrics(
    gallery_embeddings: np.ndarray,
    gallery_labels: np.ndarray,
    query_embeddings: np.ndarray,
    query_labels: np.ndarray,
    top_k_list: List[int] = [1, 5, 10],
) -> Dict[str, float]:
    """
    Evaluates wedding photo discovery: guest selfie (query) searching through event photo gallery.
    Calculates Precision@K and Recall@K.
    """
    sim_matrix = np.dot(query_embeddings, gallery_embeddings.T)
    num_queries = len(query_labels)
    results = {}

    for k in top_k_list:
        precisions = []
        recalls = []

        for q_idx in range(num_queries):
            target_label = query_labels[q_idx]
            # Total true matches in gallery
            total_relevant = np.sum(gallery_labels == target_label)
            if total_relevant == 0:
                continue

            # Top K retrieved indices
            top_indices = np.argsort(sim_matrix[q_idx])[::-1][:k]
            retrieved_labels = gallery_labels[top_indices]

            hits = np.sum(retrieved_labels == target_label)
            precisions.append(hits / float(k))
            recalls.append(hits / float(total_relevant))

        results[f"precision@{k}"] = float(np.mean(precisions)) if precisions else 0.0
        results[f"recall@{k}"] = float(np.mean(recalls)) if recalls else 0.0

    return results


def benchmark_inference_speed(
    model: torch.nn.Module,
    device: torch.device,
    input_shape: Tuple[int, int, int, int] = (1, 3, 112, 112),
    num_runs: int = 100,
    warmup: int = 15,
) -> Dict[str, float]:
    """
    Profiles inference latency (ms per face) and indexing throughput (faces/sec).
    """
    model.eval()
    dummy_input = torch.randn(input_shape, device=device)

    # Warmup
    with torch.no_grad():
        for _ in range(warmup):
            _ = model(dummy_input)

    if device.type == "cuda":
        torch.cuda.synchronize()

    start_time = time.perf_counter()
    with torch.no_grad():
        for _ in range(num_runs):
            _ = model(dummy_input)
            if device.type == "cuda":
                torch.cuda.synchronize()

    total_time = time.perf_counter() - start_time
    latency_ms = (total_time / num_runs) * 1000.0
    throughput = (num_runs * input_shape[0]) / total_time

    return {
        "latency_ms": float(latency_ms),
        "throughput_faces_per_sec": float(throughput),
        "batch_size": input_shape[0],
    }
