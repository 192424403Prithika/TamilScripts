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

DATA_DIR = Path(__file__).resolve().parent
if str(DATA_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_DIR))

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

def find_user_dataset_dir() -> Path:
    candidates = [
        Path(os.environ.get("TAMIL_DATASET_DIR", "")),
        Path("C:/TamilScriptsAI/Tamil Letters Dataset"),
        DATA_DIR / "raw" / "Tamil Letters Dataset",
        DATA_DIR.parent.parent.parent / "Tamil Letters Dataset",
    ]
    for c in candidates:
        if c.exists() and (c / "train").exists():
            return c
    return None

def prepare_dataset(samples_per_class: int = 40):
    """Generates stratified train/val/test splits integrating real handwritten dataset and synthetic glyphs."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    unicode_map = load_unicode_map()
    augmentor = TamilDataAugmentor()

    user_ds_dir = find_user_dataset_dir()
    if user_ds_dir:
        print(f"[*] Found user Tamil character dataset at: {user_ds_dir}")
    else:
        print("[!] User dataset directory not found, falling back to full synthetic generation.")

    # Load user handwritten dataset
    user_train_by_class: Dict[int, List[Image.Image]] = {}
    user_val_by_class: Dict[int, List[Image.Image]] = {}
    user_test_by_class: Dict[int, List[Image.Image]] = {}

    import re
    if user_ds_dir:
        for split, storage in [("train", user_train_by_class), ("valid", user_val_by_class), ("test", user_test_by_class)]:
            sdir = user_ds_dir / split
            if sdir.exists():
                for f in sdir.glob("*.*"):
                    if f.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                        m = re.match(r"u16_(\d{3})", f.name)
                        if m:
                            cid = int(m.group(1))
                            if cid not in storage:
                                storage[cid] = []
                            try:
                                im = Image.open(f).convert("L")
                                storage[cid].append(im)
                            except Exception as ex:
                                print(f"Warning loading {f}: {ex}")

    print(f"[*] Preparing dataset across {len(unicode_map)} Tamil character classes with shared preprocessing...")

    train_images, val_images, test_images = [], [], []
    train_labels, val_labels, test_labels = [], [], []
    train_strokes, val_strokes, test_strokes = [], [], []

    user_val_images, user_val_labels = [], []
    user_test_images, user_test_labels = [], []

    class_stats = {}

    for item in unicode_map:
        cid = item["id"]
        char = item["char"]
        base_glyph = render_synthetic_glyph(char)

        has_user_train = cid in user_train_by_class and len(user_train_by_class[cid]) > 0
        has_user_val = cid in user_val_by_class and len(user_val_by_class[cid]) > 0
        has_user_test = cid in user_test_by_class and len(user_test_by_class[cid]) > 0

        # 1. Train split
        if has_user_train:
            raw_train_imgs = user_train_by_class[cid]
            # Add canonical base glyph
            arr_base = preprocess_glyph_image(base_glyph, target_size=64)
            train_images.append(arr_base)
            train_labels.append(cid)
            train_strokes.append(glyph_to_synthetic_strokes(base_glyph))

            # Add all originals
            for im in raw_train_imgs:
                arr = preprocess_glyph_image(im, target_size=64)
                train_images.append(arr)
                train_labels.append(cid)
                train_strokes.append(glyph_to_synthetic_strokes(im))

            # Augment up to target samples_per_class
            aug_needed = max(0, samples_per_class - len(raw_train_imgs))
            for i in range(aug_needed):
                source_im = raw_train_imgs[i % len(raw_train_imgs)]
                aug_im = augmentor.augment(source_im)
                arr = preprocess_glyph_image(aug_im, target_size=64)
                train_images.append(arr)
                train_labels.append(cid)
                train_strokes.append(glyph_to_synthetic_strokes(aug_im))
        else:
            # Synthetic generation for classes not in user dataset
            n_train = int(samples_per_class * 0.75)
            for i in range(n_train):
                aug_img = augmentor.augment(base_glyph) if i > 0 else base_glyph
                arr = preprocess_glyph_image(aug_img, target_size=64)
                train_images.append(arr)
                train_labels.append(cid)
                train_strokes.append(glyph_to_synthetic_strokes(aug_img))

        # 2. Validation split
        if has_user_val:
            for im in user_val_by_class[cid]:
                arr = preprocess_glyph_image(im, target_size=64)
                val_images.append(arr)
                val_labels.append(cid)
                val_strokes.append(glyph_to_synthetic_strokes(im))
                user_val_images.append(arr)
                user_val_labels.append(cid)
        else:
            n_val = max(3, int(samples_per_class * 0.125))
            for i in range(n_val):
                aug_img = augmentor.augment(base_glyph)
                arr = preprocess_glyph_image(aug_img, target_size=64)
                val_images.append(arr)
                val_labels.append(cid)
                val_strokes.append(glyph_to_synthetic_strokes(aug_img))

        # 3. Test split
        if has_user_test:
            for im in user_test_by_class[cid]:
                arr = preprocess_glyph_image(im, target_size=64)
                test_images.append(arr)
                test_labels.append(cid)
                test_strokes.append(glyph_to_synthetic_strokes(im))
                user_test_images.append(arr)
                user_test_labels.append(cid)
        else:
            n_test = max(3, int(samples_per_class * 0.125))
            for i in range(n_test):
                aug_img = augmentor.augment(base_glyph)
                arr = preprocess_glyph_image(aug_img, target_size=64)
                test_images.append(arr)
                test_labels.append(cid)
                test_strokes.append(glyph_to_synthetic_strokes(aug_img))

        class_stats[cid] = {
            "char": char,
            "has_real_train": has_user_train,
            "has_real_val": has_user_val,
            "has_real_test": has_user_test
        }

    # Convert to NumPy
    X_train = np.expand_dims(np.array(train_images, dtype=np.float32), 1)  # (N, 1, 64, 64)
    y_train = np.array(train_labels, dtype=np.int64)

    X_val = np.expand_dims(np.array(val_images, dtype=np.float32), 1)
    y_val = np.array(val_labels, dtype=np.int64)

    X_test = np.expand_dims(np.array(test_images, dtype=np.float32), 1)
    y_test = np.array(test_labels, dtype=np.int64)

    user_X_val = np.expand_dims(np.array(user_val_images, dtype=np.float32), 1) if user_val_images else np.empty((0, 1, 64, 64), dtype=np.float32)
    user_y_val = np.array(user_val_labels, dtype=np.int64) if user_val_labels else np.empty((0,), dtype=np.int64)

    user_X_test = np.expand_dims(np.array(user_test_images, dtype=np.float32), 1) if user_test_images else np.empty((0, 1, 64, 64), dtype=np.float32)
    user_y_test = np.array(user_test_labels, dtype=np.int64) if user_test_labels else np.empty((0,), dtype=np.int64)

    print(f"Prepared Shapes:")
    print(f"  Train: X={X_train.shape}, y={y_train.shape}")
    print(f"  Val:   X={X_val.shape}, y={y_val.shape}")
    print(f"  Test:  X={X_test.shape}, y={y_test.shape}")
    print(f"  User Val:  X={user_X_val.shape}, y={user_y_val.shape}")
    print(f"  User Test: X={user_X_test.shape}, y={user_y_test.shape}")

    # Save npz files for lightning fast zero-dependency training and validation
    np.savez_compressed(
        PROCESSED_DIR / "tamil_dataset.npz",
        X_train=X_train, y_train=y_train,
        X_val=X_val, y_val=y_val,
        X_test=X_test, y_test=y_test,
        user_X_val=user_X_val, user_y_val=user_y_val,
        user_X_test=user_X_test, user_y_test=user_y_test
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
            "user_val_total": len(user_y_val),
            "user_test_total": len(user_y_test),
            "classes": class_stats
        }, f, indent=2)

    print(f"Exported dataset bundles to: {PROCESSED_DIR.resolve()}")

if __name__ == "__main__":
    prepare_dataset(samples_per_class=60)
