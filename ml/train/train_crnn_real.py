"""
Train Real-Time Tamil CRNN (CNN + BiLSTM + CTC) on Real Handwritten Tamil Words (c3rl/IIIT-INDIC-HW-WORDS-Tamil).
Exports to ONNX for live in-browser inference (Gate 3: Validation CER < 20%).
"""

import os
import sys
import io
import time
import json
import argparse
from pathlib import Path
from typing import List, Dict, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
from PIL import Image, ImageOps
import torchvision.transforms as T
import pyarrow.parquet as pq

# Force UTF-8 stdout
try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

ML_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ML_DIR / "models"))
from crnn import TamilCRNN

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

def preprocess_word_image(img: Image.Image, target_h: int = 32, target_w: int = 128) -> torch.Tensor:
    """
    Standard preprocessing for CRNN input:
    1. Grayscale.
    2. Polarity: dark background with bright ink (> 30).
    3. Bounding box crop.
    4. Resize keeping aspect ratio to height 32.
    5. Pad width to target_w.
    6. Normalize to [0.0, 1.0].
    """
    gray = img.convert("L")
    arr = np.array(gray)
    # Check if light background (paper scan)
    if np.mean(arr) > 127:
        gray = ImageOps.invert(gray)
        arr = np.array(gray)

    # Ink bbox crop
    y_idx, x_idx = np.where(arr > 30)
    if len(y_idx) > 0 and len(x_idx) > 0:
        crop = gray.crop((int(np.min(x_idx)), int(np.min(y_idx)), int(np.max(x_idx)) + 1, int(np.max(y_idx)) + 1))
    else:
        crop = gray

    w, h = crop.size
    if h == 0 or w == 0:
        return torch.zeros(1, target_h, target_w, dtype=torch.float32)

    # Scale to height 32 keeping aspect ratio
    new_w = min(target_w, max(8, int(w * (target_h / h))))
    resized = crop.resize((new_w, target_h), Image.Resampling.BILINEAR)

    # Pad into target_w
    padded = Image.new("L", (target_w, target_h), color=0)
    padded.paste(resized, (0, 0))

    tensor = torch.tensor(np.array(padded, dtype=np.float32) / 255.0).unsqueeze(0)
    return tensor

class TamilCRNNDataset(Dataset):
    def __init__(self, parquet_path: str, vocab: Dict[str, int], offset: int = 0, max_samples: int = None, augment: bool = False):
        self.vocab = vocab
        self.augment = augment
        self.samples = []

        table = pq.read_table(parquet_path)
        texts = table["text"].to_pylist()
        images = table["image"].to_pylist()

        for idx, (t, img_dict) in enumerate(zip(texts, images)):
            if idx < offset:
                continue
            t_clean = t.strip() if t else ""
            if t_clean and img_dict.get("bytes"):
                # Ensure all characters are in vocab
                if all(c in self.vocab for c in t_clean):
                    self.samples.append((t_clean, img_dict["bytes"]))
            if max_samples and len(self.samples) >= max_samples:
                break

        print(f"[+] Loaded {len(self.samples)} valid samples (offset={offset}) from {Path(parquet_path).name}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx: int):
        text, img_bytes = self.samples[idx]
        img = Image.open(io.BytesIO(img_bytes))
        tensor = preprocess_word_image(img)
        target = [self.vocab[c] for c in text]
        return tensor, torch.tensor(target, dtype=torch.long), text

def collate_fn(batch):
    tensors, targets, texts = zip(*batch)
    batch_tensors = torch.stack(tensors, dim=0) # (B, 1, 32, W)
    target_lengths = torch.tensor([len(t) for t in targets], dtype=torch.long)
    flat_targets = torch.cat(targets)
    return batch_tensors, flat_targets, target_lengths, texts

def train_and_export_crnn(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training TamilCRNN on device: {device}")

    # Load vocabulary
    vocab_path = ML_DIR / "data" / "tamil_ctc_vocab.json"
    with open(vocab_path, "r", encoding="utf-8") as f:
        vocab = json.load(f)
    id_to_char = {idx: ch for ch, idx in vocab.items()}

    test_parquet = r"C:\Users\Patan Afrin\.cache\huggingface\hub\datasets--c3rl--IIIT-INDIC-HW-WORDS-Tamil\snapshots\b723be4b446bcf55f9102a9784d3f4c012085d80\data\test-00000-of-00002.parquet"

    # Strictly disjoint training and validation datasets
    train_ds = TamilCRNNDataset(test_parquet, vocab, offset=0, max_samples=args.train_samples, augment=True)
    val_ds = TamilCRNNDataset(test_parquet, vocab, offset=args.train_samples, max_samples=args.val_samples, augment=False)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, collate_fn=collate_fn)

    model = TamilCRNN(num_classes=len(vocab), hidden_size=args.hidden_size).to(device)

    ckpt_dir = ML_DIR / "checkpoints"
    export_dir = ML_DIR / "export" / "saved_models"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    export_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = ckpt_dir / "crnn_best.pt"

    if args.resume and ckpt_path.exists():
        try:
            model.load_state_dict(torch.load(ckpt_path, map_location=device))
            print(f"[+] Resumed weights from {ckpt_path}")
        except Exception as e:
            print(f"[!] Could not resume: {e}")

    ctc_loss = nn.CTCLoss(blank=0, zero_infinity=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-5)

    best_cer = float("inf")

    print(f"[*] Starting training for {args.epochs} epochs. Target: Validation CER < 20% (GATE 3)")
    for epoch in range(1, args.epochs + 1):
        model.train()
        train_loss = 0.0
        t0 = time.time()

        for bx, flat_targets, target_lengths, texts in train_loader:
            bx = bx.to(device)
            flat_targets = flat_targets.to(device)
            b_size = bx.size(0)

            optimizer.zero_grad()
            logits = model(bx) # (T, B, num_classes)
            seq_len = logits.size(0)
            input_lengths = torch.full((b_size,), seq_len, dtype=torch.long, device=device)

            log_probs = logits.log_softmax(2)
            loss = ctc_loss(log_probs, flat_targets, input_lengths, target_lengths)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss += loss.item()

        epoch_time = time.time() - t0
        avg_train_loss = train_loss / max(1, len(train_loader))

        # Evaluation
        model.eval()
        total_char_dist = 0
        total_ref_chars = 0
        word_errors = 0
        total_words = 0

        with torch.no_grad():
            for bx, flat_targets, target_lengths, texts in val_loader:
                bx = bx.to(device)
                logits = model(bx)
                decoded_seqs = model.decode_greedy(logits)

                for true_text, pred_ids in zip(texts, decoded_seqs):
                    pred_text = "".join([id_to_char.get(i, "") for i in pred_ids if i != 0])
                    dist = levenshtein_distance(true_text, pred_text)
                    total_char_dist += dist
                    total_ref_chars += max(1, len(true_text))
                    if true_text != pred_text:
                        word_errors += 1
                    total_words += 1

        val_cer = (total_char_dist / max(1, total_ref_chars)) * 100.0
        val_wer = (word_errors / max(1, total_words)) * 100.0

        print(f"Epoch [{epoch:02d}/{args.epochs:02d}] ({epoch_time:.1f}s) CTC Loss: {avg_train_loss:.4f} | Val CER: {val_cer:.2f}% | Val WER: {val_wer:.2f}%")

        if val_cer < best_cer:
            best_cer = val_cer
            torch.save(model.state_dict(), ckpt_dir / "crnn_best.pt")
            print(f"[+] Saved checkpoint to {ckpt_dir / 'crnn_best.pt'} (Best CER: {best_cer:.2f}%)")

        if best_cer < 20.0:
            print(f"[SUCCESS] GATE 3 PASSED: Validation CER {best_cer:.2f}% < 20.0%!")

    # Export best model to ONNX once after training finishes
    print("[*] Exporting best CRNN checkpoint to ONNX...")
    model.load_state_dict(torch.load(ckpt_dir / "crnn_best.pt", map_location=device))
    model.eval()
    dummy_input = torch.randn(1, 1, 32, 128, device=device)
    onnx_path = export_dir / "crnn.onnx"
    try:
        torch.onnx.export(
            model,
            dummy_input,
            str(onnx_path),
            input_names=["input"],
            output_names=["logits"],
            dynamic_axes={"input": {0: "batch_size", 3: "width"}, "logits": {0: "time", 1: "batch_size"}},
            opset_version=14,
            dynamo=False
        )
    except Exception:
        torch.onnx.export(
            model,
            dummy_input,
            str(onnx_path),
            input_names=["input"],
            output_names=["logits"],
            dynamic_axes={"input": {0: "batch_size", 3: "width"}, "logits": {0: "time", 1: "batch_size"}},
            opset_version=14
        )
    frontend_onnx = Path("frontend/public/models/crnn.onnx")
    frontend_onnx.parent.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copyfile(str(onnx_path), str(frontend_onnx))
    print(f"[+] Exported CRNN to ONNX: {onnx_path} & {frontend_onnx}")
    print(f"[*] Final Best Validation CER: {best_cer:.2f}%")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--train_samples", type=int, default=1500)
    parser.add_argument("--val_samples", type=int, default=200)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--hidden_size", type=int, default=128)
    parser.add_argument("--lr", type=float, default=5e-4)
    parser.add_argument("--resume", action="store_true", help="Resume from crnn_best.pt")
    args = parser.parse_args()
    train_and_export_crnn(args)
