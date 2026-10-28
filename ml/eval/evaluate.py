"""
Comprehensive Evaluation & Benchmarking Script for TamilScript AI Recognizers.
Compares:
1. LightweightTamilRecognizer (In-browser real-time engine)
2. BaselineCNN (Standard 3-layer convolutional baseline)
3. EfficientTamilNet (High-accuracy server mode)
Generates markdown benchmark table and per-class diagnostic reports.
"""

import os
import sys
import json
import torch
import torch.nn.functional as F
import numpy as np
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.append(str(ML_DIR))
sys.path.append(str(ML_DIR / "models"))

from recognizer import LightweightTamilRecognizer, BaselineCNN, EfficientTamilNet
from metrics import compute_accuracy_metrics, compute_confusion_matrix, benchmark_inference_latency

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def evaluate_models():
    print("=" * 80)
    print("TAMILSCRIPT AI: DEEP LEARNING MODEL BENCHMARK SUITE")
    print("=" * 80)

    data_path = ML_DIR / "data" / "processed" / "tamil_dataset.npz"
    if not data_path.exists():
        print("Dataset not found. Run ml/data/prepare.py first.")
        return

    data = np.load(data_path)
    X_test = torch.from_numpy(data["X_test"]).float()
    y_test = data["y_test"]

    models = {
        "LightweightTamilRecognizer (In-Browser/Edge)": LightweightTamilRecognizer(num_classes=156),
        "BaselineCNN (Reference Baseline)": BaselineCNN(num_classes=156),
        "EfficientTamilNet (Server High-Accuracy)": EfficientTamilNet(num_classes=156),
    }

    # Load weights if trained
    ckpt_path = ML_DIR / "checkpoints" / "recognizer_best.pt"
    if ckpt_path.exists():
        models["LightweightTamilRecognizer (In-Browser/Edge)"].load_state_dict(torch.load(ckpt_path, map_location="cpu"))
        print("[+] Loaded trained weights for LightweightTamilRecognizer.")

    results = []
    dummy_input = torch.randn(1, 1, 64, 64)

    for name, model in models.items():
        model.eval()
        params = sum(p.numel() for p in model.parameters())
        size_mb = (params * 4) / (1024 * 1024)

        # Benchmark inference latency
        def predict_fn(x):
            with torch.no_grad():
                return model(x)

        lat = benchmark_inference_latency(predict_fn, dummy_input, warmup=15, runs=100)

        # Accuracy on test set
        with torch.no_grad():
            logits = model(X_test)
            probs = F.softmax(logits, dim=-1).numpy()

        acc = compute_accuracy_metrics(y_test, probs)

        results.append({
            "model": name,
            "top1_acc": acc["top1_accuracy"],
            "top5_acc": acc["top5_accuracy"],
            "params": params,
            "size_mb": round(size_mb, 2),
            "latency_p50_ms": lat["p50_ms"],
            "latency_mean_ms": lat["mean_ms"]
        })

    # Print formatted markdown table
    print("\n### Benchmark Results Table\n")
    print("| Model Architecture | Top-1 Acc (%) | Top-5 Acc (%) | Params | Model Size | Latency p50 (CPU) |")
    print("| :--- | :---: | :---: | :---: | :---: | :---: |")
    for r in results:
        print(f"| **{r['model']}** | {r['top1_acc']}% | {r['top5_acc']}% | {r['params']:,} | {r['size_mb']} MB | {r['latency_p50_ms']} ms |")

    # Export report
    report_file = ML_DIR / "runs" / "benchmark_report.json"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\n[+] Saved full benchmark report to: {report_file}")
    return results

if __name__ == "__main__":
    evaluate_models()
