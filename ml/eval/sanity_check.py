"""
Offline Sanity Check for Tamil Character Recognition Model.
Evaluates the exported model directly against the held-out test split:
1. Top-1 and Top-5 accuracy calculation
2. Confusion matrix computation and top confused pairs
3. Inspection of 10 sample test images (True vs Predicted Tamil Unicode)
4. Enforces the >= 95% accuracy target
"""

import sys
import json
import numpy as np
from pathlib import Path

# Set UTF-8 encoding for Windows stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ML_DIR = Path(__file__).resolve().parent.parent

def run_sanity_check(onnx_model_path: str = None, dataset_path: str = None):
    print("=" * 80)
    print("OFFLINE MODEL SANITY CHECK: TAMIL RECOGNIZER")
    print("=" * 80)

    # 1. Load Unicode map
    map_path = ML_DIR / "data" / "unicode_map.json"
    with open(map_path, "r", encoding="utf-8") as f:
        unicode_map = json.load(f)

    # 2. Load held-out test split
    if dataset_path is None:
        dataset_path = ML_DIR / "data" / "processed" / "tamil_dataset.npz"
    data = np.load(dataset_path)
    X_test = data["X_test"] # (N, 1, 64, 64)
    y_test = data["y_test"] # (N,)

    N = len(y_test)
    print(f"[*] Loaded held-out test split: {N} samples across 156 classes.")

    # 3. Load ONNX or PyTorch model
    if onnx_model_path is None:
        onnx_model_path = ML_DIR / "export" / "saved_models" / "recognizer.onnx"

    import onnxruntime as ort
    sess = ort.InferenceSession(str(onnx_model_path), providers=['CPUExecutionProvider'])
    input_name = sess.get_inputs()[0].name

    print(f"[*] Running ONNX inference with model: {Path(onnx_model_path).name}...")

    batch_size = 64
    all_preds = []
    all_top5 = []

    for i in range(0, N, batch_size):
        bx = X_test[i:i+batch_size].astype(np.float32)
        logits = sess.run(None, {input_name: bx})[0]
        # Softmax
        exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)

        preds = np.argmax(probs, axis=-1)
        top5 = np.argsort(probs, axis=-1)[:, -5:][:, ::-1]

        all_preds.extend(preds)
        all_top5.extend(top5)

    all_preds = np.array(all_preds)
    all_top5 = np.array(all_top5)

    # 4. Compute Metrics
    correct_top1 = np.sum(all_preds == y_test)
    correct_top5 = np.sum([y in top5 for y, top5 in zip(y_test, all_top5)])

    top1_acc = (correct_top1 / N) * 100.0
    top5_acc = (correct_top5 / N) * 100.0

    print(f"\n[+] EVALUATION RESULTS:")
    print(f"    - Total Test Samples: {N}")
    print(f"    - Top-1 Accuracy:     {top1_acc:.2f}% ({correct_top1}/{N})")
    print(f"    - Top-5 Accuracy:     {top5_acc:.2f}% ({correct_top5}/{N})")

    # 5. Confusion Matrix & Top Confused Pairs
    confusion_matrix = np.zeros((156, 156), dtype=np.int32)
    for true_label, pred_label in zip(y_test, all_preds):
        confusion_matrix[true_label, pred_label] += 1

    confused_pairs = []
    for i in range(156):
        for j in range(156):
            if i != j and confusion_matrix[i, j] > 0:
                confused_pairs.append((confusion_matrix[i, j], i, j))

    confused_pairs.sort(reverse=True)

    print(f"\n[*] CONFUSION MATRIX SUMMARY:")
    total_off_diagonal = int(np.sum(confusion_matrix) - np.trace(confusion_matrix))
    print(f"    - Matrix Dimensions: {confusion_matrix.shape[0]} x {confusion_matrix.shape[1]} (156 classes)")
    print(f"    - Total Diagonal Matches (Correct): {int(np.trace(confusion_matrix))}/{N} ({top1_acc:.2f}%)")
    print(f"    - Total Off-Diagonal Misclassifications: {total_off_diagonal}/{N} ({100.0 - top1_acc:.2f}%)")

    print(f"\n[*] TOP 10 MOST CONFUSED CHARACTER PAIRS:")
    if confused_pairs:
        for rank, (count, true_id, pred_id) in enumerate(confused_pairs[:10], start=1):
            t_info = unicode_map[true_id]
            p_info = unicode_map[pred_id]
            print(f"    {rank:2d}. True: '{t_info['char']}' ({t_info['transliteration']}, {t_info['unicode']}) -> Pred: '{p_info['char']}' ({p_info['transliteration']}, {p_info['unicode']}): {count} errors")
    else:
        print("    - None (Perfect diagonal confusion matrix)!")

    # 6. Print 10 Test Images: True vs Predicted Tamil Unicode
    print(f"\n[*] 10 SAMPLE TEST IMAGES: TRUE vs PREDICTED TAMIL UNICODE:")
    print("-" * 80)
    sample_indices = np.linspace(0, N - 1, 10, dtype=int)
    for idx in sample_indices:
        true_id = y_test[idx]
        pred_id = all_preds[idx]
        t_info = unicode_map[true_id]
        p_info = unicode_map[pred_id]
        top5_chars = [unicode_map[c]["char"] for c in all_top5[idx]]
        status = "MATCH" if true_id == pred_id else "MISMATCH"

        print(f"[{status:8s}] Index {idx:4d} | True: '{t_info['char']}' ({t_info['unicode']}, {t_info['transliteration']}) | "
              f"Pred: '{p_info['char']}' ({p_info['unicode']}, {p_info['transliteration']}) | "
              f"Top-5: {top5_chars}")
    print("-" * 80)

    # Target assertion
    if top5_acc >= 95.0:
        print(f"\n✅ PASSED: Top-5 accuracy {top5_acc:.2f}% meets target (>= 95.0%).")
        return True, top1_acc, top5_acc
    else:
        print(f"\n⚠️ WARNING: Top-5 accuracy {top5_acc:.2f}% is below target 95.0%.")
        return False, top1_acc, top5_acc

if __name__ == "__main__":
    success, t1, t5 = run_sanity_check()
    sys.exit(0 if success else 1)
