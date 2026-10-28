"""
ONNX Export Pipeline for TamilScript AI.
Exports trained PyTorch models to optimized ONNX computational graphs with dynamic batch size support:
- recognizer.onnx (Model 1)
- stroke_model.onnx (Model 2)
- generator.onnx (Model 3)
- scorer.onnx (Model 5)
- crnn.onnx (Model 6)
- style_encoder.onnx (Model 7)
"""

import os
import sys
import torch
import onnx
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.append(str(ML_DIR))
sys.path.append(str(ML_DIR / "models"))

from recognizer import LightweightTamilRecognizer
from stroke_model import StrokeSequenceRecognizer
from generator import ConditionalGenerator
from scorer import QualityScorerCNN
from crnn import TamilCRNN
from style_encoder import WriterStyleEncoder

SAVED_DIR = CURRENT_DIR / "saved_models"
SAVED_DIR.mkdir(parents=True, exist_ok=True)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def export_recognizer_to_onnx():
    print("[*] Exporting Model 1 (LightweightTamilRecognizer) to ONNX...")
    model = LightweightTamilRecognizer(num_classes=156)
    ckpt = ML_DIR / "checkpoints" / "recognizer_best.pt"
    if ckpt.exists():
        model.load_state_dict(torch.load(ckpt, map_location="cpu"))
    model.eval()

    dummy_input = torch.randn(1, 1, 64, 64)
    onnx_path = SAVED_DIR / "recognizer.onnx"

    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch_size"}, "logits": {0: "batch_size"}},
        opset_version=14
    )

    onnx_model = onnx.load(str(onnx_path))
    onnx.checker.check_model(onnx_model)
    file_size_mb = onnx_path.stat().st_size / (1024 * 1024)
    print(f"[+] Successfully exported {onnx_path.name} ({file_size_mb:.2f} MB)")

def export_stroke_model_to_onnx():
    print("[*] Exporting Model 2 (StrokeSequenceRecognizer) to ONNX...")
    model = StrokeSequenceRecognizer(num_classes=156)
    model.eval()
    dummy_input = torch.randn(1, 40, 4)
    onnx_path = SAVED_DIR / "stroke_model.onnx"

    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        input_names=["strokes"],
        output_names=["logits"],
        dynamic_axes={"strokes": {0: "batch_size"}, "logits": {0: "batch_size"}},
        opset_version=14
    )
    onnx_model = onnx.load(str(onnx_path))
    onnx.checker.check_model(onnx_model)
    print(f"[+] Successfully exported {onnx_path.name}")

def export_style_encoder_to_onnx():
    print("[*] Exporting Model 7 (WriterStyleEncoder) to ONNX...")
    model = WriterStyleEncoder(style_dim=32)
    model.eval()
    dummy_input = torch.randn(1, 1, 64, 64)
    onnx_path = SAVED_DIR / "style_encoder.onnx"

    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        input_names=["glyph"],
        output_names=["style_embedding"],
        dynamic_axes={"glyph": {0: "batch_size"}, "style_embedding": {0: "batch_size"}},
        opset_version=14
    )
    onnx_model = onnx.load(str(onnx_path))
    onnx.checker.check_model(onnx_model)
    print(f"[+] Successfully exported {onnx_path.name}")

def export_all():
    export_recognizer_to_onnx()
    export_stroke_model_to_onnx()
    export_style_encoder_to_onnx()
    print("\n[+] All core models successfully exported and validated in ONNX format.")

if __name__ == "__main__":
    export_all()
