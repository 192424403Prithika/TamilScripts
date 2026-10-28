"""
Evaluate Word-Level Tamil Recognition on IIIT-INDIC-HW-WORDS-Tamil test split.
Calculates Character Error Rate (CER) and Word Error Rate (WER) using neural OCR.
Also verifies recognition on three target words: கல்வி, அம்மா, தமிழ்.
"""

import sys
import io
import os
import json
import base64
import unicodedata
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import pyarrow.parquet as pq

# Force UTF-8 and line buffering for console output
try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

# Ensure backend is on sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.services.recognition_service import recognition_service, split_tamil_graphemes, transliterate_tamil_word

def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute character-level edit distance."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def render_tamil_word_image(word: str, font_size: int = 56) -> Image.Image:
    """Renders a word to an image with handwritten-style stroke thickness on canvas."""
    img = Image.new("L", (320, 160), color=0)
    draw = ImageDraw.Draw(img)
    
    font = None
    tamil_font_paths = [
        "C:\\Windows\\Fonts\\Nirmala.ttf",
        "C:\\Windows\\Fonts\\Latha.ttf",
        "C:\\Windows\\Fonts\\vijaya.ttf"
    ]
    for p in tamil_font_paths:
        if os.path.exists(p):
            try:
                font = ImageFont.truetype(p, font_size)
                break
            except Exception:
                pass

    if font:
        bbox = draw.textbbox((0, 0), word, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (320 - tw) // 2
        y = (160 - th) // 2
        draw.text((x, y), word, fill=255, font=font)
    else:
        draw.text((30, 50), word, fill=255)

    return img

def evaluate_three_fixed_words():
    print("=" * 70)
    print("STEP 6.1: EVALUATION ON THREE FIXED TARGET WORDS")
    print("=" * 70)
    target_words = ["கல்வி", "அம்மா", "தமிழ்"]
    results = {}

    for word in target_words:
        img = render_tamil_word_image(word)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

        res = recognition_service.recognize_line_or_word(b64)
        clusters = split_tamil_graphemes(res.recognized_text)
        translit = transliterate_tamil_word(res.recognized_text)

        print(f"Target Word   : {word}")
        print(f"Recognized    : {res.recognized_text}")
        print(f"Translit      : {translit}")
        print(f"Clusters      : {clusters}")
        print(f"Confidence    : {res.confidence:.4f}")
        print(f"Latency (ms)  : {res.latency_ms}")
        print("-" * 50)
        results[word] = {
            "pred": res.recognized_text,
            "clusters": clusters,
            "translit": translit,
            "conf": res.confidence
        }
    return results

def evaluate_iiit_test_split(max_samples: int = 100):
    print("=" * 70)
    print(f"STEP 6.2: EVALUATING REAL CER & WER ON IIIT TEST SPLIT ({max_samples} samples)")
    print("=" * 70)

    parquet_path = r"C:\Users\Patan Afrin\.cache\huggingface\hub\datasets--c3rl--IIIT-INDIC-HW-WORDS-Tamil\snapshots\b723be4b446bcf55f9102a9784d3f4c012085d80\data\test-00000-of-00002.parquet"
    if not os.path.exists(parquet_path):
        print(f"[-] Parquet file not found at {parquet_path}")
        return

    table = pq.read_table(parquet_path)
    total_available = len(table)
    num_to_eval = min(max_samples, total_available)

    total_char_dist = 0
    total_ref_chars = 0
    word_errors = 0
    total_words = 0

    import time
    t0 = time.time()

    for idx in range(num_to_eval):
        row = table.slice(idx, 1).to_pydict()
        gt_text = row["text"][0].strip()
        img_bytes = row["image"][0]["bytes"]

        img = Image.open(io.BytesIO(img_bytes)).convert("L")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

        pred_res = recognition_service.recognize_line_or_word(b64)
        pred_text = pred_res.recognized_text.strip()

        # Compute edit distance
        dist = levenshtein_distance(gt_text, pred_text)
        total_char_dist += dist
        total_ref_chars += max(1, len(gt_text))

        if gt_text != pred_text:
            word_errors += 1
        total_words += 1

        if idx < 10 or (idx + 1) % 25 == 0:
            print(f"[{idx+1:03d}/{num_to_eval}] True: '{gt_text}' | Pred: '{pred_text}' | Dist: {dist}")

    elapsed = time.time() - t0
    cer = (total_char_dist / max(1, total_ref_chars)) * 100.0
    wer = (word_errors / max(1, total_words)) * 100.0

    print("=" * 70)
    print("OFFLINE IIIT WORD TEST BENCHMARK RESULTS")
    print("=" * 70)
    print(f"Total Test Samples Evaluated : {total_words}")
    print(f"Total Reference Characters   : {total_ref_chars}")
    print(f"Total Character Edits        : {total_char_dist}")
    print(f"Character Error Rate (CER)   : {cer:.2f}%")
    print(f"Word Error Rate (WER)        : {wer:.2f}%")
    print(f"Word Accuracy                : {100.0 - wer:.2f}%")
    print(f"Evaluation Time              : {elapsed:.2f}s ({elapsed/total_words*1000:.1f}ms/word)")
    print("=" * 70)

if __name__ == "__main__":
    evaluate_three_fixed_words()
    evaluate_iiit_test_split(max_samples=100)
