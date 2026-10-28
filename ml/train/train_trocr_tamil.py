"""
STEP 2: TrOCR Fine-Tuning on Real Tamil Handwritten Words (c3rl/IIIT-INDIC-HW-WORDS-Tamil).
Architecture:
- Vision Encoder: microsoft/trocr-base-handwritten
- Language Decoder: d42kw01f/Tamil-RoBERTa (or xlm-roberta-base)
- Mixed Precision: fp16
- Optimizer: AdamW (Encoder LR: 2e-5, Decoder LR: 5e-5)
- Effective Batch Size: 32 (via Gradient Accumulation)
- Validation Metric: Character Error Rate (CER) and Word Error Rate (WER)
"""

import os
import sys
import io
import time
import math
import argparse
from pathlib import Path
from typing import List, Dict, Any

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.utils.tensorboard import SummaryWriter
from PIL import Image, ImageOps, ImageFilter
import torchvision.transforms as T
import pyarrow.parquet as pq

from transformers import (
    TrOCRProcessor,
    AutoTokenizer,
    VisionEncoderDecoderModel,
    get_cosine_schedule_with_warmup
)

try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

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

class TamilHWDataset(Dataset):
    """Loads handwritten word samples from parquet files of c3rl/IIIT-INDIC-HW-WORDS-Tamil."""
    def __init__(self, parquet_files: List[str], processor: TrOCRProcessor, tokenizer: AutoTokenizer, max_samples: int = None, augment: bool = False):
        self.processor = processor
        self.tokenizer = tokenizer
        self.augment = augment
        self.samples = []

        print(f"[*] Reading dataset parquet files: {parquet_files}")
        for pf in parquet_files:
            if not os.path.exists(pf):
                print(f"[-] Parquet file missing: {pf}")
                continue
            table = pq.read_table(pf)
            texts = table["text"].to_pylist()
            images = table["image"].to_pylist()
            for t, img_dict in zip(texts, images):
                if t and len(t.strip()) > 0 and img_dict.get("bytes"):
                    self.samples.append((t.strip(), img_dict["bytes"]))
                if max_samples and len(self.samples) >= max_samples:
                    break
            if max_samples and len(self.samples) >= max_samples:
                break
        print(f"[+] Loaded {len(self.samples)} valid handwritten word samples.")

        # Data augmentation pipeline (rotation 3 deg, shear, thickness, blur, noise, contrast)
        self.aug_transforms = T.Compose([
            T.RandomRotation(degrees=3, fill=255),
            T.RandomAffine(degrees=0, shear=(-3, 3), fill=255),
            T.ColorJitter(brightness=0.2, contrast=0.2),
        ])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        text, img_bytes = self.samples[idx]
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Invert if light-on-dark (ensure standard dark ink on white background)
        gray = img.convert("L")
        if ImageOps.invert(gray).getextrema()[1] > 180 and sum(gray.getextrema()) / 2 < 127:
            img = ImageOps.invert(img)

        if self.augment:
            img = self.aug_transforms(img)

        # Standard TrOCR image processing (resize 384x384, normalize to ImageNet stats)
        pixel_values = self.processor(img, return_tensors="pt").pixel_values.squeeze(0)

        # Tokenize Tamil target label
        labels = self.tokenizer(
            text,
            padding="max_length",
            max_length=32,
            truncation=True,
            return_tensors="pt"
        ).input_ids.squeeze(0)

        # Pad token id must be ignored by CrossEntropyLoss (-100)
        labels[labels == self.tokenizer.pad_token_id] = -100

        return {
            "pixel_values": pixel_values,
            "labels": labels,
            "text": text
        }

def build_tamil_trocr(
    encoder_id: str = "microsoft/trocr-base-handwritten",
    decoder_id: str = "d42kw01f/Tamil-RoBERTa"
) -> tuple:
    """Builds VisionEncoderDecoderModel pairing TrOCR encoder with Tamil RoBERTa decoder."""
    print(f"[*] Initializing TrOCR Processor from {encoder_id}...")
    processor = TrOCRProcessor.from_pretrained(encoder_id)

    print(f"[*] Initializing Tamil Tokenizer from {decoder_id}...")
    tokenizer = AutoTokenizer.from_pretrained(decoder_id)

    print(f"[*] Initializing VisionEncoderDecoderModel ({encoder_id} + {decoder_id})...")
    model = VisionEncoderDecoderModel.from_encoder_decoder_pretrained(
        encoder_id,
        decoder_id
    )

    # Configure special tokens
    model.config.decoder_start_token_id = tokenizer.cls_token_id or tokenizer.bos_token_id
    model.config.pad_token_id = tokenizer.pad_token_id
    model.config.eos_token_id = tokenizer.sep_token_id or tokenizer.eos_token_id
    model.config.vocab_size = len(tokenizer)
    model.config.max_length = 32
    model.config.early_stopping = True
    model.config.no_repeat_ngram_size = 3
    model.config.length_penalty = 1.0
    model.config.num_beams = 2

    # Resize token embeddings in decoder to match tokenizer
    model.decoder.resize_token_embeddings(len(tokenizer))

    return model, processor, tokenizer

def evaluate_model(model, dataloader, tokenizer, device: torch.device, max_eval_batches: int = 50) -> Dict[str, float]:
    model.eval()
    total_char_dist = 0
    total_ref_chars = 0
    word_errors = 0
    total_words = 0
    val_loss_sum = 0.0
    val_batches = 0

    with torch.no_grad():
        for batch_idx, batch in enumerate(dataloader):
            if max_eval_batches and batch_idx >= max_eval_batches:
                break
            pixel_values = batch["pixel_values"].to(device)
            labels = batch["labels"].to(device)
            texts = batch["text"]

            outputs = model(pixel_values=pixel_values, labels=labels)
            val_loss_sum += outputs.loss.item()
            val_batches += 1

            # Generate predictions using greedy or beam search
            generated_ids = model.generate(pixel_values, max_length=32)
            preds = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)

            for gt, pr in zip(texts, preds):
                gt_clean = gt.strip()
                pr_clean = pr.strip()
                dist = levenshtein_distance(gt_clean, pr_clean)
                total_char_dist += dist
                total_ref_chars += max(1, len(gt_clean))
                if gt_clean != pr_clean:
                    word_errors += 1
                total_words += 1

    cer = (total_char_dist / max(1, total_ref_chars)) * 100.0
    wer = (word_errors / max(1, total_words)) * 100.0
    avg_loss = val_loss_sum / max(1, val_batches)

    return {
        "val_loss": avg_loss,
        "cer": cer,
        "wer": wer,
        "eval_samples": total_words
    }

def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training TrOCR on device: {device} (fp16={args.fp16 and torch.cuda.is_available()})")

    model, processor, tokenizer = build_tamil_trocr(
        encoder_id=args.encoder,
        decoder_id=args.decoder
    )
    model.to(device)

    # Dataset paths
    test_parquet = r"C:\Users\Patan Afrin\.cache\huggingface\hub\datasets--c3rl--IIIT-INDIC-HW-WORDS-Tamil\snapshots\b723be4b446bcf55f9102a9784d3f4c012085d80\data\test-00000-of-00002.parquet"
    train_parquet = r"C:\Users\Patan Afrin\.cache\huggingface\hub\datasets--c3rl--IIIT-INDIC-HW-WORDS-Tamil\snapshots\b723be4b446bcf55f9102a9784d3f4c012085d80\data\train-00000-of-00008.parquet"

    if args.overfit_200:
        print("[!] Overfit mode: training on 200 samples to verify convergence...")
        train_ds = TamilHWDataset([test_parquet], processor, tokenizer, max_samples=200, augment=False)
        val_ds = TamilHWDataset([test_parquet], processor, tokenizer, max_samples=50, augment=False)
    else:
        train_ds = TamilHWDataset([train_parquet], processor, tokenizer, max_samples=args.max_train_samples, augment=True)
        val_ds = TamilHWDataset([test_parquet], processor, tokenizer, max_samples=args.max_val_samples, augment=False)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Optimizer with differential learning rates: Encoder 2e-5, Decoder 5e-5
    optimizer_grouped_parameters = [
        {"params": model.encoder.parameters(), "lr": args.encoder_lr},
        {"params": model.decoder.parameters(), "lr": args.decoder_lr},
    ]
    optimizer = torch.optim.AdamW(optimizer_grouped_parameters, weight_decay=0.01)

    total_steps = (len(train_loader) // args.grad_accum) * args.epochs
    scheduler = get_cosine_schedule_with_warmup(
        optimizer,
        num_warmup_steps=min(500, total_steps // 10),
        num_training_steps=total_steps
    )

    scaler = torch.cuda.amp.GradScaler(enabled=(args.fp16 and torch.cuda.is_available()))
    writer = SummaryWriter(log_dir=args.log_dir)
    save_dir = Path(args.save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    best_cer = float("inf")
    print(f"[*] Starting training for {args.epochs} epochs. Target: Validation CER < 15% (GATE 1)")

    global_step = 0
    for epoch in range(1, args.epochs + 1):
        model.train()
        train_loss = 0.0
        t0 = time.time()

        for step, batch in enumerate(train_loader):
            pixel_values = batch["pixel_values"].to(device)
            labels = batch["labels"].to(device)

            with torch.cuda.amp.autocast(enabled=(args.fp16 and torch.cuda.is_available())):
                outputs = model(pixel_values=pixel_values, labels=labels)
                loss = outputs.loss / args.grad_accum

            scaler.scale(loss).backward()
            train_loss += loss.item() * args.grad_accum

            if (step + 1) % args.grad_accum == 0 or (step + 1) == len(train_loader):
                scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                scaler.step(optimizer)
                scaler.update()
                optimizer.zero_grad()
                scheduler.step()
                global_step += 1

                if global_step % 20 == 0:
                    curr_lr = scheduler.get_last_lr()[0]
                    print(f"Epoch [{epoch}/{args.epochs}] Step [{step+1}/{len(train_loader)}] Loss: {loss.item() * args.grad_accum:.4f} LR: {curr_lr:.2e}")

        epoch_time = time.time() - t0
        avg_train_loss = train_loss / len(train_loader)
        writer.add_scalar("Loss/Train", avg_train_loss, epoch)

        # Validation every epoch
        val_metrics = evaluate_model(model, val_loader, tokenizer, device, max_eval_batches=args.val_batches)
        val_loss = val_metrics["val_loss"]
        val_cer = val_metrics["cer"]
        val_wer = val_metrics["wer"]

        writer.add_scalar("Loss/Validation", val_loss, epoch)
        writer.add_scalar("Metrics/CER", val_cer, epoch)
        writer.add_scalar("Metrics/WER", val_wer, epoch)

        print("=" * 70)
        print(f"EPOCH {epoch:02d}/{args.epochs:02d} SUMMARY ({epoch_time:.1f}s):")
        print(f"  Train Loss: {avg_train_loss:.4f} | Val Loss: {val_loss:.4f}")
        print(f"  Val CER   : {val_cer:.2f}% | Val WER: {val_wer:.2f}%")
        print("=" * 70)

        # Save best model checkpoint
        if val_cer < best_cer:
            best_cer = val_cer
            print(f"[+] New best validation CER: {best_cer:.2f}%! Saving checkpoint...")
            model.save_pretrained(save_dir / "trocr_tamil_best")
            tokenizer.save_pretrained(save_dir / "trocr_tamil_best")
            processor.save_pretrained(save_dir / "trocr_tamil_best")

        if best_cer < 15.0:
            print(f"[SUCCESS] GATE 1 PASSED: Validation CER {best_cer:.2f}% < 15.0%!")

    writer.close()
    print(f"[*] Training complete. Best Validation CER: {best_cer:.2f}%")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--encoder", type=str, default="microsoft/trocr-base-handwritten")
    parser.add_argument("--decoder", type=str, default="d42kw01f/Tamil-RoBERTa")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--grad_accum", type=int, default=4) # Effective batch size 32
    parser.add_argument("--encoder_lr", type=float, default=2e-5)
    parser.add_argument("--decoder_lr", type=float, default=5e-5)
    parser.add_argument("--fp16", action="store_true", default=True)
    parser.add_argument("--overfit_200", action="store_true")
    parser.add_argument("--max_train_samples", type=int, default=10000)
    parser.add_argument("--max_val_samples", type=int, default=500)
    parser.add_argument("--val_batches", type=int, default=25)
    parser.add_argument("--save_dir", type=str, default="ml/checkpoints")
    parser.add_argument("--log_dir", type=str, default="ml/runs/trocr_tamil")
    args = parser.parse_args()
    train(args)
