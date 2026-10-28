"""
Data Preparation & Stratified Split Pipeline for TamilScript AI.
- Processes raw images or bootstraps high-fidelity synthetic glyph samples
- Performs stratified 70% Train / 15% Validation / 15% Test split
- Generates online stroke trajectories (x, y, pen_state, time_delta)
- Exports class-balance report and dataset statistics
"""

import os
import sys
import json
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from typing import Dict, List, Tuple
from augment import TamilDataAugmentor
from preprocess import preprocess_glyph_image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


DATA_DIR = Path(__file__).resolve().parent
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
UNICODE_MAP_PATH = DATA_DIR / "unicode_map.json"

def load_unicode_map() -> List[Dict]:
    with open(UNICODE_MAP_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def render_synthetic_glyph(char: str, size: Tuple[int, int] = (64, 64)) -> Image.Image:
    """Renders a clean centered grayscale Tamil glyph on black background."""
    img = Image.new("L", (128, 128), color=0)
    draw = ImageDraw.Draw(img)
    
    # Try finding system Tamil font or default
    font = None
    system_fonts = [
        "C:\\Windows\\Fonts\\Nirmala.ttc",
        "C:\\Windows\\Fonts\\NirmalaB.ttf",
        "C:\\Windows\\Fonts\\NirmalaS.ttf",
        "C:\\Windows\\Fonts\\Latha.ttf",
        "C:\\Windows\\Fonts\\arial.ttf"
    ]
    for sf in system_fonts:
        if os.path.exists(sf):
            try:
                font = ImageFont.truetype(sf, 64)
                break
            except Exception:
                pass
                
    if font is None:
        font = ImageFont.load_default()

    # Center bounding box
    bbox = draw.textbbox((0, 0), char, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (128 - text_w) // 2 - bbox[0]
    y = (128 - text_h) // 2 - bbox[1]
    
    draw.text((x, y), char, fill=255, font=font)
    # Downsample with anti-aliasing to 64x64
    img_resized = img.resize(size, Image.Resampling.LANCZOS)
    return img_resized

def glyph_to_synthetic_strokes(image: Image.Image, num_points: int = 40) -> List[Tuple[float, float, int, float]]:
    """
    Extracts ordered contour/skeleton points from glyph to synthesize
    online pen stroke trajectory: (norm_x, norm_y, pen_down, dt).
    """
    arr = np.array(image, dtype=np.uint8)
    coords = np.argwhere(arr > 70)  # y, x
    if len(coords) < 10:
        # fallback circle stroke
        angles = np.linspace(0, 2 * np.pi, num_points)
        return [(float(0.5 + 0.3 * np.cos(a)), float(0.5 + 0.3 * np.sin(a)), 1, 0.02) for a in angles]
    
    # Sort top to bottom, left to right
    indices = np.linspace(0, len(coords) - 1, num_points, dtype=int)
    sampled = coords[indices]
    
    strokes = []
    for i, (y, x) in enumerate(sampled):
        pen_down = 1
        if i == len(sampled) - 1:
            pen_down = 0
        norm_x = round(float(x) / 64.0, 4)
        norm_y = round(float(y) / 64.0, 4)
        dt = 0.025  # ~40 Hz sampling rate
        strokes.append((norm_x, norm_y, pen_down, dt))
    return strokes

def prepare_dataset(samples_per_class: int = 60):
    """Generates stratified train/val/test splits and saves structured arrays."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    unicode_map = load_unicode_map()
    augmentor = TamilDataAugmentor()

    print(f"Preparing dataset across {len(unicode_map)} Tamil character classes with shared preprocessing...")

    train_images, val_images, test_images = [], [], []
    train_labels, val_labels, test_labels = [], [], []
    train_strokes, val_strokes, test_strokes = [], [], []

    class_stats = {}

    for item in unicode_map:
        cid = item["id"]
        char = item["char"]
        base_glyph = render_synthetic_glyph(char)

        # Split counts (70% train, 15% val, 15% test)
        n_train = int(samples_per_class * 0.70)
        n_val = int(samples_per_class * 0.15)
        n_test = samples_per_class - n_train - n_val

        class_stats[cid] = {"char": char, "train": n_train, "val": n_val, "test": n_test}

        for i in range(samples_per_class):
            aug_img = augmentor.augment(base_glyph) if i > 0 else base_glyph
            img_arr = preprocess_glyph_image(aug_img, target_size=64)
            strokes = glyph_to_synthetic_strokes(aug_img)

            if i < n_train:
                train_images.append(img_arr)
                train_labels.append(cid)
                train_strokes.append(strokes)
            elif i < n_train + n_val:
                val_images.append(img_arr)
                val_labels.append(cid)
                val_strokes.append(strokes)
            else:
                test_images.append(img_arr)
                test_labels.append(cid)
                test_strokes.append(strokes)

    # Convert to NumPy
    X_train = np.expand_dims(np.array(train_images, dtype=np.float32), 1)  # (N, 1, 64, 64)
    y_train = np.array(train_labels, dtype=np.int64)

    X_val = np.expand_dims(np.array(val_images, dtype=np.float32), 1)
    y_val = np.array(val_labels, dtype=np.int64)

    X_test = np.expand_dims(np.array(test_images, dtype=np.float32), 1)
    y_test = np.array(test_labels, dtype=np.int64)

    print(f"✅ Prepared Shapes:")
    print(f"  Train: X={X_train.shape}, y={y_train.shape}")
    print(f"  Val:   X={X_val.shape}, y={y_val.shape}")
    print(f"  Test:  X={X_test.shape}, y={y_test.shape}")

    # Save npz files for lightning fast zero-dependency training and validation
    np.savez_compressed(
        PROCESSED_DIR / "tamil_dataset.npz",
        X_train=X_train, y_train=y_train,
        X_val=X_val, y_val=y_val,
        X_test=X_test, y_test=y_test
    )

    # Save stroke sequences
    with open(PROCESSED_DIR / "tamil_strokes.json", "w", encoding="utf-8") as f:
        json.dump({
            "train": train_strokes,
            "val": val_strokes,
            "test": test_strokes,
            "train_labels": train_labels[:len(train_strokes)],
            "val_labels": val_labels[:len(val_strokes)],
            "test_labels": test_labels[:len(test_strokes)]
        }, f)

    # Save class distribution report
    with open(PROCESSED_DIR / "class_balance_report.json", "w", encoding="utf-8") as f:
        json.dump({
            "num_classes": len(unicode_map),
            "samples_per_class": samples_per_class,
            "train_total": len(y_train),
            "val_total": len(y_val),
            "test_total": len(y_test),
            "classes": class_stats
        }, f, indent=2)

    print(f"✅ Exported dataset bundles to: {PROCESSED_DIR.resolve()}")

if __name__ == "__main__":
    prepare_dataset(samples_per_class=60)
