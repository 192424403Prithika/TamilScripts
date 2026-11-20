"""
Gate 2 Training & Verification: Handwriting Synthesis (Graves-style LSTM-MDN).
Conditioned on Tamil grapheme cluster sequences.
Pass criteria:
1. Render 20 generated words to ml/reports/synth_words.png. Each character must look different and be recognizable.
2. Recognizer classifies >= 80% of generated characters as the intended character.
3. Fallback: glyph-composition mode using Gate 1 generator on ruled line, labelled "Glyph-composition mode".
4. Export to ONNX and verify stroke animation trajectory.
"""

import os
import sys
import time
import math
import json
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import TensorDataset, DataLoader
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "models"))

from synth import HandwritingSynthesisMDN
from recognizer import LightweightTamilRecognizer

def mdn_loss(params: torch.Tensor, target_dx: torch.Tensor, target_dy: torch.Tensor, target_eos: torch.Tensor, num_mixtures: int = 20):
    M = num_mixtures
    eos_logit = params[:, :, 0]
    pi_logits = params[:, :, 1:M+1]
    mu_x = params[:, :, M+1:2*M+1]
    mu_y = params[:, :, 2*M+1:3*M+1]
    sigma_x = torch.exp(torch.clamp(params[:, :, 3*M+1:4*M+1], -5.0, 5.0))
    sigma_y = torch.exp(torch.clamp(params[:, :, 4*M+1:5*M+1], -5.0, 5.0))
    rho = torch.tanh(params[:, :, 5*M+1:6*M+1]) * 0.95

    dx = target_dx.unsqueeze(-1) - mu_x
    dy = target_dy.unsqueeze(-1) - mu_y

    one_minus_rho2 = 1.0 - rho.pow(2)
    norm_x = dx / sigma_x
    norm_y = dy / sigma_y

    z = norm_x.pow(2) + norm_y.pow(2) - 2.0 * rho * norm_x * norm_y
    denom = 2.0 * 3.14159265 * sigma_x * sigma_y * torch.sqrt(one_minus_rho2)
    exp_term = torch.exp(-z / (2.0 * one_minus_rho2))

    log_pi = F.log_softmax(pi_logits, dim=-1)
    log_prob = log_pi + torch.log(exp_term / denom + 1e-8)
    loss_coords = -torch.logsumexp(log_prob, dim=-1).mean()
    loss_eos = F.binary_cross_entropy_with_logits(eos_logit, target_eos)
    return loss_coords + loss_eos

def render_strokes_to_image(strokes_seq: list, width: int = 64, height: int = 64) -> np.ndarray:
    """
    Renders (dx, dy, pen_up) sequence into a 64x64 binary glyph image for recognizer evaluation.
    strokes_seq: list of (dx, dy, pen_up)
    """
    img = Image.new("L", (width, height), color=0) # black background, white strokes (for recognizer)
    draw = ImageDraw.Draw(img)

    # Reconstruct absolute coordinates
    curr_x, curr_y = 10.0, 32.0
    points = [(curr_x, curr_y)]
    for dx, dy, pen_up in strokes_seq:
        curr_x += dx * 20.0
        curr_y += dy * 20.0
        points.append((curr_x, curr_y, pen_up))

    # Normalize bounding box into 64x64 center
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    w = max(1.0, max_x - min_x)
    h = max(1.0, max_y - min_y)
    scale = min(48.0 / w, 48.0 / h)

    norm_points = []
    for x, y, *rest in points:
        nx = 32.0 + (x - (min_x + max_x) / 2.0) * scale
        ny = 32.0 + (y - (min_y + max_y) / 2.0) * scale
        pen_up = rest[0] if rest else 0
        norm_points.append((nx, ny, pen_up))

    for i in range(1, len(norm_points)):
        p0 = norm_points[i - 1]
        p1 = norm_points[i]
        if p0[2] == 0: # pen is down
            draw.line([(p0[0], p0[1]), (p1[0], p1[1])], fill=255, width=3)

    arr = np.array(img, dtype=np.float32) / 255.0
    return arr

def train_synthesis(epochs: int = 50, batch_size: int = 64):
    device = torch.device("cpu")
    print(f"[*] Training Handwriting Synthesis MDN on {device}...", flush=True)

    strokes_path = ROOT / "data" / "processed" / "tamil_strokes.json"
    with open(strokes_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    train_raw = np.array(raw_data["train"], dtype=np.float32) # (7155, 40, 4): [x, y, pen_down, dt]
    train_labels = np.array(raw_data["train_labels"], dtype=np.int64)

    # Compute coordinate deltas [dx, dy, pen_up]
    dx = np.diff(train_raw[:, :, 0], axis=1, prepend=train_raw[:, :1, 0])
    dy = np.diff(train_raw[:, :, 1], axis=1, prepend=train_raw[:, :1, 1])
    pen_up = 1.0 - train_raw[:, :, 2] # 1 when pen is lifted

    # Normalize dx, dy
    mean_dx, std_dx = np.mean(dx), np.std(dx) + 1e-6
    mean_dy, std_dy = np.mean(dy), np.std(dy) + 1e-6

    norm_dx = np.clip((dx - mean_dx) / std_dx, -5.0, 5.0)
    norm_dy = np.clip((dy - mean_dy) / std_dy, -5.0, 5.0)

    stroke_inputs = np.stack([norm_dx, norm_dy, pen_up], axis=-1).astype(np.float32) # (7155, 40, 3)

    X_tensor = torch.from_numpy(stroke_inputs)
    y_tensor = torch.from_numpy(train_labels)

    dataset = TensorDataset(X_tensor, y_tensor)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, drop_last=True)

    num_classes = 156
    model = HandwritingSynthesisMDN(num_chars=num_classes, char_emb_dim=64, hidden_dim=256, num_mixtures=20).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    ckpt_dir = ROOT / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    best_path = ckpt_dir / "synth_best.pt"

    print(f"[*] Training MDN model for {epochs} epochs...", flush=True)
    t0_train = time.time()

    best_loss = 1e9
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        batches = 0

        for batch_strokes, batch_labels in loader:
            B, T, _ = batch_strokes.shape
            optimizer.zero_grad()

            char_emb = model.char_emb(batch_labels) # (B, 64)

            # Sequential MDN unrolling with teacher forcing
            h1 = torch.zeros(B, 256, device=device)
            c1 = torch.zeros(B, 256, device=device)
            h2 = torch.zeros(B, 256, device=device)
            c2 = torch.zeros(B, 256, device=device)

            all_params = []
            for t in range(T):
                stroke_in = batch_strokes[:, t]
                params_t, h1, c1, h2, c2 = model.forward_step(stroke_in, char_emb, h1, c1, h2, c2)
                all_params.append(params_t)

            params = torch.stack(all_params, dim=1) # (B, T, 121)
            target_dx = batch_strokes[:, :, 0]
            target_dy = batch_strokes[:, :, 1]
            target_eos = batch_strokes[:, :, 2]

            loss = mdn_loss(params, target_dx, target_dy, target_eos)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            total_loss += loss.item()
            batches += 1

        scheduler.step()
        avg_loss = total_loss / max(1, batches)
        if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
            print(f"Epoch {epoch:2d}/{epochs} | MDN Loss: {avg_loss:.4f}", flush=True)
            if avg_loss < best_loss:
                best_loss = avg_loss
                torch.save(model.state_dict(), best_path)

    print(f"[*] Training finished in {(time.time() - t0_train)/60:.2f} mins. Saved checkpoint to {best_path}", flush=True)

    # Gate 2 Pass Criterion 1: Render 20 generated words to ml/reports/synth_words.png
    print("\n[*] Evaluating Gate 2 pass criteria...", flush=True)
    words = [
        "தமிழ்", "வாழ்க", "வணக்கம்", "அன்பு", "அறிவு",
        "கலை", "எழுத்து", "பாட்டு", "சொல்", "பண்பு",
        "நன்றி", "வெற்றி", "மகிழ்ச்சி", "உண்மை", "நீதி",
        "காலம்", "உலகம்", "பூமி", "நிலவு", "சூரியன்"
    ]

    report_img_path = ROOT / "reports" / "synth_words.png"
    # Load recognizer to test generated character recognition
    rec_ckpt = ROOT / "checkpoints" / "recognizer_best.pt"
    recognizer = LightweightTamilRecognizer(num_classes=num_classes).to(device)
    if rec_ckpt.exists():
        recognizer.load_state_dict(torch.load(rec_ckpt, map_location=device))
    recognizer.eval()

    # Load unicode map for grapheme clustering
    with open(ROOT / "core" / "unicode_map.json" if (ROOT / "core" / "unicode_map.json").exists() else ROOT.parent / "backend" / "app" / "core" / "unicode_map.json", "r", encoding="utf-8") as f:
        umap = json.load(f)
    char_map = {item["char"]: item["id"] for item in umap}

    def tokenize_word(word):
        clusters = []
        i = 0
        while i < len(word):
            matched = False
            for l in [3, 2, 1]:
                if i + l <= len(word):
                    sub = word[i:i+l]
                    if sub in char_map:
                        clusters.append((sub, char_map[sub]))
                        i += l
                        matched = True
                        break
            if not matched:
                i += 1
        return clusters

    # Canvas to render all 20 words (10 rows x 2 cols)
    word_canvas = Image.new("RGB", (800, 1000), color=(255, 255, 255))
    draw_canvas = ImageDraw.Draw(word_canvas)

    total_chars = 0
    correct_chars = 0

    model.eval()
    with torch.no_grad():
        for w_idx, word in enumerate(words):
            tokens = tokenize_word(word)
            row = w_idx % 10
            col = w_idx // 10
            start_x = 40 + col * 380
            baseline_y = 50 + row * 95

            # Draw word label in gray
            draw_canvas.text((start_x, baseline_y - 30), f"{word}:", fill=(120, 120, 120))

            cursor_x = start_x
            for char_str, cid in tokens:
                char_tensor = torch.tensor([cid], dtype=torch.long)
                char_emb = model.char_emb(char_tensor)

                h1 = torch.zeros(1, 256)
                c1 = torch.zeros(1, 256)
                h2 = torch.zeros(1, 256)
                c2 = torch.zeros(1, 256)
                stroke_in = torch.zeros(1, 3)

                char_points = []
                for _ in range(40):
                    params, h1, c1, h2, c2 = model.forward_step(stroke_in, char_emb, h1, c1, h2, c2)
                    dx_s, dy_s, pen_up_s = model.sample_stroke(params, bias=1.5)
                    # Denormalize
                    dx_real = dx_s * std_dx + mean_dx
                    dy_real = dy_s * std_dy + mean_dy
                    char_points.append((dx_real, dy_real, pen_up_s))
                    stroke_in = torch.tensor([[dx_s, dy_s, float(pen_up_s)]])

                # Render to glyph image and pass to recognizer
                glyph_arr = render_strokes_to_image(char_points)
                glyph_tensor = torch.from_numpy(glyph_arr).unsqueeze(0).unsqueeze(0).float()
                rec_pred = torch.argmax(recognizer(glyph_tensor), dim=1).item()

                total_chars += 1
                if rec_pred == cid:
                    correct_chars += 1

                # Draw to composite word image
                px, py = cursor_x, baseline_y
                for dx_r, dy_r, p_up in char_points:
                    nx = px + dx_r * 22.0
                    ny = py + dy_r * 22.0
                    if p_up == 0:
                        draw_canvas.line([(px, py), (nx, ny)], fill=(200, 69, 45), width=3)
                    px, py = nx, ny
                cursor_x += 45

    word_canvas.save(report_img_path)
    synth_acc = (correct_chars / max(1, total_chars)) * 100.0
    print(f"[*] Rendered 20 words to {report_img_path}", flush=True)
    print(f"[*] Character Recognizer Accuracy on Generated Words: {synth_acc:.2f}% (Target: >= 80%)", flush=True)

    metrics = {
        "recognizer_acc_on_synth_words": round(synth_acc, 2),
        "target_accuracy": 80.0,
        "pass_criteria_met": bool(synth_acc >= 80.0),
        "words_rendered": len(words),
        "total_characters_evaluated": total_chars,
        "report_image": str(report_img_path)
    }

    metrics_path = ROOT / "runs" / "synth_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"GATE 2 STATUS: {'PASSED' if synth_acc >= 80.0 else 'FALLBACK_READY'}")

if __name__ == "__main__":
    train_synthesis(epochs=50)
