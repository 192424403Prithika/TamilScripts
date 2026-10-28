"""
Comprehensive Evaluation Metrics for Tamil Deep Learning Models.
Computes:
- Top-1 and Top-5 accuracy
- Per-class precision, recall, and F1-score
- Confusion matrix heatmap data
- Latency (p50, p95, p99) in milliseconds
- Model parameter count and disk footprint (MB)
"""

import time
import numpy as np
from typing import Dict, List, Any

def compute_accuracy_metrics(y_true: np.ndarray, y_pred_probs: np.ndarray, top_k: int = 5) -> Dict[str, float]:
    y_pred_top1 = np.argmax(y_pred_probs, axis=-1)
    top1_acc = np.mean(y_pred_top1 == y_true) * 100.0

    # Top-K
    top_k_preds = np.argsort(y_pred_probs, axis=-1)[:, -top_k:]
    top_k_hits = [y_true[i] in top_k_preds[i] for i in range(len(y_true))]
    top5_acc = np.mean(top_k_hits) * 100.0

    return {
        "top1_accuracy": round(float(top1_acc), 2),
        "top5_accuracy": round(float(top5_acc), 2)
    }

def compute_per_class_f1(y_true: np.ndarray, y_pred_probs: np.ndarray, num_classes: int = 156) -> Dict[int, Dict[str, float]]:
    y_pred = np.argmax(y_pred_probs, axis=-1)
    report = {}
    for c in range(num_classes):
        tp = np.sum((y_pred == c) & (y_true == c))
        fp = np.sum((y_pred == c) & (y_true != c))
        fn = np.sum((y_pred != c) & (y_true == c))

        prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        report[c] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "support": int(np.sum(y_true == c))
        }
    return report

def compute_confusion_matrix(y_true: np.ndarray, y_pred_probs: np.ndarray, num_classes: int = 156) -> np.ndarray:
    y_pred = np.argmax(y_pred_probs, axis=-1)
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1
    return cm

def benchmark_inference_latency(predict_fn, sample_input, warmup: int = 10, runs: int = 100) -> Dict[str, float]:
    """Measures latency in milliseconds on CPU/GPU."""
    # Warmup
    for _ in range(warmup):
        _ = predict_fn(sample_input)

    latencies = []
    for _ in range(runs):
        t0 = time.perf_counter()
        _ = predict_fn(sample_input)
        latencies.append((time.perf_counter() - t0) * 1000.0)

    latencies = np.array(latencies)
    return {
        "mean_ms": round(float(np.mean(latencies)), 2),
        "p50_ms": round(float(np.percentile(latencies, 50)), 2),
        "p95_ms": round(float(np.percentile(latencies, 95)), 2),
        "p99_ms": round(float(np.percentile(latencies, 99)), 2),
        "min_ms": round(float(np.min(latencies)), 2),
        "max_ms": round(float(np.max(latencies)), 2)
    }
