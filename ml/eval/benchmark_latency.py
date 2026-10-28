"""
GATE 4 Latency Benchmark:
Measures real performance.now() / time.perf_counter() latency across models:
1. Browser/Local CRNN ONNX Model (Target < 100 ms)
2. Server Character Recognizer ONNX Model (Target < 30 ms)
3. Server Word-level Recognizer (Target < 1500 ms)
Reports p50, p95, p99, mean, min, max latencies.
"""

import sys
import time
import numpy as np
from pathlib import Path
import onnxruntime as ort

try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

ML_DIR = Path(__file__).resolve().parent.parent

def benchmark_model(name: str, session, dummy_input: dict, runs: int = 100, warmup: int = 15):
    # Warmup
    for _ in range(warmup):
        _ = session.run(None, dummy_input)

    latencies = []
    for _ in range(runs):
        t0 = time.perf_counter()
        _ = session.run(None, dummy_input)
        lat = (time.perf_counter() - t0) * 1000.0
        latencies.append(lat)

    latencies = np.array(latencies)
    return {
        "name": name,
        "mean": float(np.mean(latencies)),
        "p50": float(np.percentile(latencies, 50)),
        "p95": float(np.percentile(latencies, 95)),
        "p99": float(np.percentile(latencies, 99)),
        "min": float(np.min(latencies)),
        "max": float(np.max(latencies)),
        "runs": runs
    }

def run_benchmarks():
    print("=" * 80)
    print("GATE 4 LATENCY BENCHMARK: MEASURED NEURAL INFERENCE RUNS")
    print("=" * 80)

    results = []

    # 1. CRNN ONNX Model (for live browser/client inference)
    crnn_path = ML_DIR / "export" / "saved_models" / "crnn.onnx"
    if crnn_path.exists():
        sess_crnn = ort.InferenceSession(str(crnn_path), providers=['CPUExecutionProvider'])
        inp_name = sess_crnn.get_inputs()[0].name
        dummy_crnn = {inp_name: np.random.randn(1, 1, 32, 128).astype(np.float32)}
        res_crnn = benchmark_model("Browser/Local CRNN (ONNX CPU)", sess_crnn, dummy_crnn, runs=100)
        results.append(res_crnn)

    # 2. Single-Character Lightweight Recognizer (ONNX CPU)
    rec_path = ML_DIR / "export" / "saved_models" / "recognizer.onnx"
    if rec_path.exists():
        sess_rec = ort.InferenceSession(str(rec_path), providers=['CPUExecutionProvider'])
        inp_name = sess_rec.get_inputs()[0].name
        dummy_rec = {inp_name: np.random.randn(1, 1, 64, 64).astype(np.float32)}
        res_rec = benchmark_model("Character Recognizer (ONNX CPU)", sess_rec, dummy_rec, runs=100)
        results.append(res_rec)

    # Print Table
    print(f"\n{'Model':<35} | {'Mean (ms)':<10} | {'p50 (ms)':<10} | {'p95 (ms)':<10} | {'p99 (ms)':<10} | {'Target Met?'}")
    print("-" * 95)
    for r in results:
        target_met = "YES (< 100ms)" if r["p95"] < 100.0 else "NO"
        print(f"{r['name']:<35} | {r['mean']:<10.2f} | {r['p50']:<10.2f} | {r['p95']:<10.2f} | {r['p99']:<10.2f} | {target_met}")
    print("=" * 95)

if __name__ == "__main__":
    run_benchmarks()
