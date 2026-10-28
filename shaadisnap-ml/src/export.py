"""
ShaadiSnap AI - Model Export & ONNX Runtime Parity Verification
Implements:
1. PyTorch to ONNX export with dynamic batch axes.
2. Parity validation: tests numerical agreement between PyTorch and ONNXRuntime (cosine similarity > 0.9999).
3. Latency benchmarking comparing PyTorch and ONNX Runtime execution.
4. Model metadata packaging and versioning.
"""

from typing import Dict, Any, Optional, Tuple
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import time
import argparse
import numpy as np
import torch
import onnx
import onnxruntime as ort

from src.backbone import build_backbone


def export_to_onnx(
    model: torch.nn.Module,
    output_onnx_path: str,
    input_size: Tuple[int, int] = (112, 112),
    opset_version: int = 14,
    device: str = "cpu",
) -> str:
    """
    Exports a trained face recognition backbone to ONNX with dynamic batch dimensions.
    """
    model.eval()
    model.to(device)

    dummy_input = torch.randn(1, 3, input_size[0], input_size[1], device=device)
    os.makedirs(os.path.dirname(os.path.abspath(output_onnx_path)), exist_ok=True)

    print(f"[Export] Exporting PyTorch model to ONNX: {output_onnx_path} (Opset {opset_version})...")
    torch.onnx.export(
        model,
        dummy_input,
        output_onnx_path,
        export_params=True,
        opset_version=opset_version,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["embedding"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "embedding": {0: "batch_size"},
        },
    )

    # Validate ONNX model structure
    onnx_model = onnx.load(output_onnx_path)
    onnx.checker.check_model(onnx_model)
    file_size_mb = os.path.getsize(output_onnx_path) / (1024 * 1024)
    print(f"[Export] ONNX export verified successfully. Model size: {file_size_mb:.2f} MB")
    return output_onnx_path


def verify_onnx_parity(
    pytorch_model: torch.nn.Module,
    onnx_path: str,
    input_size: Tuple[int, int] = (112, 112),
    batch_size: int = 4,
    atol: float = 1e-4,
) -> Dict[str, Any]:
    """
    Compares outputs of PyTorch model and ONNX Runtime session on identical random tensors.
    Checks maximum absolute difference and cosine similarity parity.
    """
    pytorch_model.eval()
    dummy_input = torch.randn(batch_size, 3, input_size[0], input_size[1])

    # PyTorch inference
    with torch.no_grad():
        pt_out = pytorch_model(dummy_input).numpy()

    # ONNX Runtime inference
    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    ort_inputs = {"input": dummy_input.numpy()}
    ort_out = session.run(["embedding"], ort_inputs)[0]

    # Parity metrics
    max_abs_diff = float(np.max(np.abs(pt_out - ort_out)))
    mean_abs_diff = float(np.mean(np.abs(pt_out - ort_out)))

    # Cosine similarity per sample
    pt_norm = pt_out / np.linalg.norm(pt_out, axis=1, keepdims=True)
    ort_norm = ort_out / np.linalg.norm(ort_out, axis=1, keepdims=True)
    cosine_sims = np.sum(pt_norm * ort_norm, axis=1)
    min_cosine_sim = float(np.min(cosine_sims))

    passed = (max_abs_diff < atol) or (min_cosine_sim > 0.9999)

    report = {
        "passed": passed,
        "max_abs_diff": max_abs_diff,
        "mean_abs_diff": mean_abs_diff,
        "min_cosine_similarity": min_cosine_sim,
        "batch_size_tested": batch_size,
        "output_shape": list(ort_out.shape),
    }

    print(f"[Parity Check] Result: {'PASSED' if passed else 'FAILED'}")
    print(f"  Max Absolute Difference: {max_abs_diff:.6e}")
    print(f"  Min Cosine Similarity:   {min_cosine_sim:.6f}")
    return report


def benchmark_onnx_vs_pytorch(
    pytorch_model: torch.nn.Module,
    onnx_path: str,
    input_size: Tuple[int, int] = (112, 112),
    batch_size: int = 1,
    num_runs: int = 50,
) -> Dict[str, float]:
    """Benchmarks CPU execution time for PyTorch vs ONNX Runtime."""
    dummy_input = torch.randn(batch_size, 3, input_size[0], input_size[1])
    dummy_np = dummy_input.numpy()

    # PyTorch timing
    pytorch_model.eval()
    for _ in range(5):
        _ = pytorch_model(dummy_input)

    start = time.perf_counter()
    for _ in range(num_runs):
        with torch.no_grad():
            _ = pytorch_model(dummy_input)
    pt_time = (time.perf_counter() - start) / num_runs * 1000.0

    # ONNX Runtime timing
    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    for _ in range(5):
        _ = session.run(["embedding"], {"input": dummy_np})

    start = time.perf_counter()
    for _ in range(num_runs):
        _ = session.run(["embedding"], {"input": dummy_np})
    ort_time = (time.perf_counter() - start) / num_runs * 1000.0

    speedup = pt_time / ort_time if ort_time > 0 else 1.0

    return {
        "pytorch_latency_ms": pt_time,
        "onnx_latency_ms": ort_time,
        "speedup_factor": speedup,
    }


def main():
    parser = argparse.ArgumentParser(description="Export ShaadiSnap AI Model to ONNX")
    parser.add_argument("--model", type=str, default="iresnet50", help="Backbone model name")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to checkpoint")
    parser.add_argument("--output", type=str, default="checkpoints/shaadisnap_face.onnx", help="Output ONNX path")
    args = parser.parse_args()

    model = build_backbone(name=args.model, pretrained_path=args.checkpoint)
    export_to_onnx(model, args.output)
    verify_onnx_parity(model, args.output)


if __name__ == "__main__":
    main()
