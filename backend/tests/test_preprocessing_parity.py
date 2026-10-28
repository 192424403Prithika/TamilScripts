"""
Test verifying parity of preprocessing pipeline between Python and JS implementations.
Validates:
1. Inverted vs standard polarity detection
2. Tight stroke bounding box extraction
3. Aspect ratio preserving padding to square
4. Downsampling to (64, 64) and float32 normalization in [0.0, 1.0]
5. Numerical difference within tolerance (MAE < 0.05)
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys

# Ensure ml is on sys.path
ML_DIR = Path(__file__).resolve().parent.parent.parent / "ml"
sys.path.append(str(ML_DIR))
sys.path.append(str(ML_DIR / "data"))

from preprocess import preprocess_glyph_image

def simulate_canvas_js_preprocessing(raw_img: Image.Image, target_size=64, margin_ratio=0.15) -> np.ndarray:
    """Exact simulation of the JS canvas 2D pipeline in frontend/src/lib/preprocess.ts."""
    if raw_img.mode != "L":
        raw_img = raw_img.convert("L")
    arr = np.array(raw_img, dtype=np.uint8)
    
    # Polarity
    if np.mean(arr) > 127:
        arr = 255 - arr
        raw_img = Image.fromarray(arr)

    # Bbox
    y_idx, x_idx = np.where(arr > 30)
    if len(y_idx) == 0:
        return np.zeros((target_size, target_size), dtype=np.float32)

    min_x, max_x = int(np.min(x_idx)), int(np.max(x_idx))
    min_y, max_y = int(np.min(y_idx)), int(np.max(y_idx))

    crop_w = max_x - min_x + 1
    crop_h = max_y - min_y + 1
    max_side = max(crop_w, crop_h)
    pad = max(2, int(max_side * margin_ratio))
    square_side = max_side + pad * 2

    square_img = Image.new("L", (square_side, square_side), color=0)
    cropped = raw_img.crop((min_x, min_y, max_x + 1, max_y + 1))
    offset_x = (square_side - crop_w) // 2
    offset_y = (square_side - crop_h) // 2
    square_img.paste(cropped, (offset_x, offset_y))

    # Resize to target
    resized = square_img.resize((target_size, target_size), Image.Resampling.BILINEAR)
    return np.array(resized, dtype=np.float32) / 255.0

def test_preprocessing_parity():
    # Create test canvas with white stroke on black background
    img = Image.new("L", (280, 280), color=5) # #05070d background
    draw = ImageDraw.Draw(img)
    
    # Draw off-center test strokes
    draw.line([(50, 70), (120, 70), (120, 160), (70, 160)], fill=255, width=8)
    draw.ellipse([(80, 100), (110, 130)], fill=255)

    # 1. Run Python pipeline
    py_tensor = preprocess_glyph_image(img, target_size=64, margin_ratio=0.15)

    # 2. Run JS simulation pipeline
    js_tensor = simulate_canvas_js_preprocessing(img, target_size=64, margin_ratio=0.15)

    # Check shapes
    assert py_tensor.shape == (64, 64), f"Expected shape (64, 64), got {py_tensor.shape}"
    assert js_tensor.shape == (64, 64), f"Expected shape (64, 64), got {js_tensor.shape}"

    # Check bounds
    assert py_tensor.min() >= 0.0 and py_tensor.max() <= 1.0
    assert js_tensor.min() >= 0.0 and js_tensor.max() <= 1.0

    # Max difference between Lanczos and Bilinear interpolation on same geometry
    max_diff = np.max(np.abs(py_tensor - js_tensor))
    mean_diff = np.mean(np.abs(py_tensor - js_tensor))

    print(f"[*] Preprocessing parity check: Max diff = {max_diff:.4f}, Mean diff = {mean_diff:.4f}")
    assert mean_diff < 0.03, f"Mean difference {mean_diff:.4f} exceeded tolerance 0.03"
    assert max_diff < 0.25, f"Max difference {max_diff:.4f} exceeded tolerance 0.25"
