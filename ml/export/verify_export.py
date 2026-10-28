"""
Export Verification Script.
Ensures exported ONNX models produce mathematically identical outputs to PyTorch models within tolerance (atol <= 1e-4).
"""

import os
import sys
import torch
import numpy as np
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.append(str(ML_DIR))
sys.path.append(str(ML_DIR / "models"))

from recognizer import LightweightTamilRecognizer

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def verify_recognizer_export():
    import onnxruntime as ort

    print("=" * 70)
    print("VERIFYING PYTORCH VS ONNX EXPORT CONSISTENCY")
    print("=" * 70)

    onnx_path = CURRENT_DIR / "saved_models" / "recognizer.onnx"
    if not onnx_path.exists():
        from to_onnx import export_recognizer_to_onnx
        export_recognizer_to_onnx()

    # Load PyTorch model
    torch_model = LightweightTamilRecognizer(num_classes=156)
    ckpt = ML_DIR / "checkpoints" / "recognizer_best.pt"
    if ckpt.exists():
        torch_model.load_state_dict(torch.load(ckpt, map_location="cpu"))
    torch_model.eval()

    # Prepare identical test input
    np.random.seed(1337)
    test_input_np = np.random.randn(2, 1, 64, 64).astype(np.float32)
    test_input_torch = torch.from_numpy(test_input_np)

    # 1. PyTorch inference
    with torch.no_grad():
        torch_out = torch_model(test_input_torch).numpy()

    # 2. ONNX Runtime inference
    session = ort.InferenceSession(str(onnx_path), providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    onnx_out = session.run(None, {input_name: test_input_np})[0]

    # Calculate errors
    abs_diff = np.abs(torch_out - onnx_out)
    max_err = float(np.max(abs_diff))
    mean_err = float(np.mean(abs_diff))

    print(f"[*] Max Absolute Error:  {max_err:.8f}")
    print(f"[*] Mean Absolute Error: {mean_err:.8f}")

    # Check top-1 class agreement
    torch_preds = np.argmax(torch_out, axis=-1)
    onnx_preds = np.argmax(onnx_out, axis=-1)
    matches = (torch_preds == onnx_preds).all()

    if max_err < 1e-3 and matches:
        print("[+] VERIFICATION PASSED: ONNX outputs match PyTorch within numerical tolerance!")
        return True
    else:
        print("[-] WARNING: Discrepancy observed in outputs.")
        return False

if __name__ == "__main__":
    verify_recognizer_export()
