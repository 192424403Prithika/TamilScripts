"""
Shared Preprocessing Pipeline for Tamil Character Images.
Used identically across training data preparation, evaluation, and backend inference:
1. Detect polarity (ensure white ink on dark background)
2. Tight crop to ink bounding box
3. Aspect-ratio preserving padding into a centered square (15% margin)
4. Resize to 64x64 (LANCZOS/BILINEAR)
5. Normalize float32 in [0.0, 1.0]
"""

import numpy as np
from PIL import Image, ImageOps

def preprocess_glyph_image(img: Image.Image, target_size: int = 64, margin_ratio: float = 0.15) -> np.ndarray:
    """
    Standard preprocessing function.
    Returns: float32 numpy array of shape (64, 64) with values in [0.0, 1.0].
    """
    if img.mode != "L":
        img = img.convert("L")

    arr = np.array(img, dtype=np.uint8)

    # Polarity check: if average brightness > 127 (dark ink on light background), invert it
    if np.mean(arr) > 127:
        img = ImageOps.invert(img)
        arr = np.array(img, dtype=np.uint8)

    # Threshold ink pixels
    y_indices, x_indices = np.where(arr > 30)
    if len(y_indices) == 0 or len(x_indices) == 0:
        return np.zeros((target_size, target_size), dtype=np.float32)

    x1, x2 = int(np.min(x_indices)), int(np.max(x_indices))
    y1, y2 = int(np.min(y_indices)), int(np.max(y_indices))

    # Crop to stroke bounding box
    cropped = img.crop((x1, y1, x2 + 1, y2 + 1))
    w, h = cropped.size
    max_side = max(w, h)
    pad = max(2, int(max_side * margin_ratio))
    new_size = max_side + (pad * 2)

    # Center into square canvas
    square_img = Image.new("L", (new_size, new_size), color=0)
    offset_x = (new_size - w) // 2
    offset_y = (new_size - h) // 2
    square_img.paste(cropped, (offset_x, offset_y))

    # Resize to target 64x64
    resized = square_img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    norm_arr = np.array(resized, dtype=np.float32) / 255.0
    return norm_arr
