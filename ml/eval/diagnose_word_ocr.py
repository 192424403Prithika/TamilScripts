"""
STEP 1 DIAGNOSTIC SCRIPT:
Evaluates current word recognition pipeline on real handwritten test split of c3rl/IIIT-INDIC-HW-WORDS-Tamil.
Measures CER, WER, latency, and prints 20 true vs predicted examples.
"""

import sys
import io
import os
import base64
import time
import pyarrow.parquet as pq
from PIL import Image

try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.services.recognition_service import recognition_service

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            ins = prev[j + 1] + 1
            dele = curr[j] + 1
            sub = prev[j] + (c1 != c2)
            curr.append(min(ins, dele, sub))
        prev = curr
    return prev[-1]

parquet_path = r"C:\Users\Patan Afrin\.cache\huggingface\hub\datasets--c3rl--IIIT-INDIC-HW-WORDS-Tamil\snapshots\b723be4b446bcf55f9102a9784d3f4c012085d80\data\test-00000-of-00002.parquet"
if not os.path.exists(parquet_path):
    print(f"[-] Parquet dataset not found at {parquet_path}")
    sys.exit(1)

table = pq.read_table(parquet_path)
total_available = len(table)
print(f"[*] Loaded IIIT-INDIC-HW-WORDS-Tamil test parquet: {total_available} samples available.")

num_samples = 20
total_char_dist = 0
total_ref_chars = 0
word_errors = 0
latencies = []

print("=" * 80)
print(f"STEP 1 DIAGNOSTIC: EVALUATION OF CURRENT WORD MODEL ON 20 REAL HANDWRITTEN SAMPLES")
print("=" * 80)

for idx in range(num_samples):
    row = table.slice(idx, 1).to_pydict()
    gt_text = row["text"][0].strip()
    img_bytes = row["image"][0]["bytes"]

    img = Image.open(io.BytesIO(img_bytes)).convert("L")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    t0 = time.perf_counter()
    res = recognition_service.recognize_line_or_word(b64)
    elapsed = (time.perf_counter() - t0) * 1000.0
    latencies.append(elapsed)

    pred_text = res.recognized_text.strip()
    dist = levenshtein_distance(gt_text, pred_text)
    total_char_dist += dist
    total_ref_chars += max(1, len(gt_text))
    if gt_text != pred_text:
        word_errors += 1

    status = "EXACT MATCH" if gt_text == pred_text else "MISMATCH"
    print(f"[{idx+1:02d}/20] True: '{gt_text}' | Pred: '{pred_text}' | Conf: {res.confidence:.2f} | Latency: {elapsed:.1f}ms | Dist: {dist} ({status})")

cer = (total_char_dist / max(1, total_ref_chars)) * 100.0
wer = (word_errors / num_samples) * 100.0

print("=" * 80)
print(f"STEP 1 DIAGNOSTIC SUMMARY (20 Real Handwritten Test Images):")
print(f"  - Total Reference Characters: {total_ref_chars}")
print(f"  - Total Character Edits: {total_char_dist}")
print(f"  - Current CER: {cer:.2f}%")
print(f"  - Current WER: {wer:.2f}%")
print(f"  - Average Latency: {sum(latencies)/len(latencies):.1f} ms (Min: {min(latencies):.1f} ms, Max: {max(latencies):.1f} ms)")
print("=" * 80)
