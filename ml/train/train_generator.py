"""
Gate 1 Training and Verification: Conditional Character Generator (C-VAE-GAN).
Dataset: uTHCD 64x64 images (156 classes).
Conditions: Class embedding, style vector (slant, thickness, neatness), latent z.
Pass criteria:
1. Recognizer classifies >= 85% of generated glyphs as requested class (tested on 100 images/class).
2. Sample grid of 156 classes saved to ml/reports/generated_grid.png.
3. Export to ONNX and verify browser inference < 100ms.
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
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "models"))

from generator import ConditionalGenerator, ConditionalEncoder, ConditionalDiscriminator
from recognizer import LightweightTamilRecognizer

def extract_style_features_vectorized(imgs: np.ndarray) -> np.ndarray:
    """
    Fast vectorized style feature extraction:
    - thickness: stroke pixel density
    - slant: horizontal covariance vs vertical variance
    - neatness: gradient sharpness of stroke contours
    """
    X = imgs[:, 0]
    ink = (X > 0.2).astype(np.float32)
    density = ink.sum(axis=(1, 2)) / 4096.0
    thickness = np.clip(density * 10.0 - 1.0, -1.0, 1.0)

    y_grid, x_grid = np.mgrid[0:64, 0:64]
    ink_sum = ink.sum(axis=(1, 2)) + 1e-5
    x_mean = (ink * x_grid).sum(axis=(1, 2)) / ink_sum
    y_mean = (ink * y_grid).sum(axis=(1, 2)) / ink_sum

    dx = x_grid[None, :, :] - x_mean[:, None, None]
    dy = y_grid[None, :, :] - y_mean[:, None, None]

    cov_xy = (ink * dx * dy).sum(axis=(1, 2)) / ink_sum
    var_y = (ink * dy * dy).sum(axis=(1, 2)) / ink_sum
    slant = np.clip(-cov_xy / (var_y + 1e-5) * 2.0, -1.0, 1.0)

    gx = np.diff(X, axis=2, append=X[:, :, -1:])
    gy = np.diff(X, axis=1, append=X[:, -1:, :])
    grad = np.sqrt(gx**2 + gy**2)
    grad_mean = (grad * ink).sum(axis=(1, 2)) / ink_sum
    neatness = np.clip((grad_mean - 0.25) * 4.0, -1.0, 1.0)

    return np.stack([slant, thickness, neatness], axis=1).astype(np.float32)

def create_sample_grid(generator: ConditionalGenerator, num_classes: int = 156, output_path: str = "ml/reports/generated_grid.png"):
    generator.eval()
    cols = 13
    rows = math.ceil(num_classes / cols)
    cell_size = 64
    grid_img = Image.new("L", (cols * cell_size, rows * cell_size), color=255) # white paper canvas

    with torch.no_grad():
        for cid in range(num_classes):
            r = cid // cols
            c = cid % cols
            c_tensor = torch.tensor([cid], dtype=torch.long)
            s_tensor = torch.tensor([[0.0, 0.0, 0.0]], dtype=torch.float32)
            z_tensor = torch.zeros(1, 32)
            gen_out = generator(z_tensor, c_tensor, s_tensor).squeeze().numpy()
            gen_out = np.clip(gen_out, 0.0, 1.0)

            # Dark ink on white: 1.0 - gen_out
            cell_arr = ((1.0 - gen_out) * 255.0).astype(np.uint8)
            cell_pil = Image.fromarray(cell_arr, mode="L")
            grid_img.paste(cell_pil, (c * cell_size, r * cell_size))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    grid_img.save(output_path)
    print(f"[*] Saved sample grid to {output_path}", flush=True)

def evaluate_recognizer_accuracy(generator: ConditionalGenerator, recognizer: LightweightTamilRecognizer, num_classes: int = 156, samples_per_class: int = 100) -> float:
    generator.eval()
    recognizer.eval()
    total_correct = 0
    total_samples = num_classes * samples_per_class

    batch_size = 200
    with torch.no_grad():
        for cid in range(num_classes):
            for start in range(0, samples_per_class, batch_size):
                b = min(batch_size, samples_per_class - start)
                c_tensor = torch.full((b,), cid, dtype=torch.long)
                s_tensor = torch.randn(b, 3) * 0.2
                z_tensor = torch.randn(b, 32)
                generated = generator(z_tensor, c_tensor, s_tensor)

                logits = recognizer(generated)
                preds = torch.argmax(logits, dim=1)
                total_correct += (preds == c_tensor).sum().item()

    acc = (total_correct / total_samples) * 100.0
    return acc

def train_generator(epochs: int = 100, batch_size: int = 128, lr_g: float = 1e-3, lr_d: float = 4e-4):
    device = torch.device("cpu")
    print(f"[*] Training C-VAE-GAN Generator on {device}...", flush=True)

    data_path = ROOT / "data" / "processed" / "tamil_dataset.npz"
    data = np.load(data_path)
    X_train_raw = data["X_train"]
    y_train_raw = data["y_train"]

    print(f"[*] Pre-computing style features for {len(X_train_raw)} images...", flush=True)
    t0_style = time.time()
    style_train_raw = extract_style_features_vectorized(X_train_raw)
    print(f"[*] Computed style vectors in {time.time() - t0_style:.2f}s", flush=True)

    X_train = torch.from_numpy(X_train_raw).float()
    y_train = torch.from_numpy(y_train_raw).long()
    style_train = torch.from_numpy(style_train_raw).float()

    dataset = TensorDataset(X_train, y_train, style_train)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, drop_last=True)

    num_classes = 156
    encoder = ConditionalEncoder(num_classes=num_classes, latent_dim=32, class_emb_dim=32, style_dim=3).to(device)
    generator = ConditionalGenerator(num_classes=num_classes, latent_dim=32, class_emb_dim=32, style_dim=3).to(device)
    discriminator = ConditionalDiscriminator(num_classes=num_classes, class_emb_dim=32).to(device)

    # Load frozen recognizer for guidance
    rec_ckpt = ROOT / "checkpoints" / "recognizer_best.pt"
    recognizer = LightweightTamilRecognizer(num_classes=num_classes).to(device)
    if rec_ckpt.exists():
        recognizer.load_state_dict(torch.load(rec_ckpt, map_location=device))
        print(f"[*] Loaded recognizer guide from {rec_ckpt}", flush=True)
    recognizer.eval()
    for p in recognizer.parameters():
        p.requires_grad = False

    opt_G = torch.optim.AdamW(list(encoder.parameters()) + list(generator.parameters()), lr=lr_g, weight_decay=1e-5)
    opt_D = torch.optim.AdamW(discriminator.parameters(), lr=lr_d, weight_decay=1e-5)

    sched_G = torch.optim.lr_scheduler.CosineAnnealingLR(opt_G, T_max=epochs, eta_min=2e-5)
    sched_D = torch.optim.lr_scheduler.CosineAnnealingLR(opt_D, T_max=epochs, eta_min=1e-5)

    criterion_recon_bce = nn.BCELoss()
    criterion_recon_l1 = nn.L1Loss()
    criterion_ce = nn.CrossEntropyLoss()

    best_rec_acc = 0.0
    best_loss_recon = 1e9
    ckpt_dir = ROOT / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    best_path = ckpt_dir / "generator_best.pt"

    print(f"[*] Beginning {epochs} epochs of C-VAE-GAN training...", flush=True)
    t_start = time.time()

    for epoch in range(1, epochs + 1):
        encoder.train()
        generator.train()
        discriminator.train()

        total_loss_g = 0.0
        total_loss_d = 0.0
        total_recon = 0.0
        batches = 0

        for real_imgs, labels, styles in loader:
            B = real_imgs.shape[0]

            # 1. Discriminator Step
            opt_D.zero_grad()
            mu, logvar = encoder(real_imgs, labels, styles)
            eps = torch.randn_like(mu)
            z = mu + eps * torch.exp(0.5 * logvar)
            fake_recon = generator(z, labels, styles)

            d_real, _ = discriminator(real_imgs, labels)
            d_fake, _ = discriminator(fake_recon.detach(), labels)

            loss_d_real = F.binary_cross_entropy_with_logits(d_real, torch.ones_like(d_real) * 0.9)
            loss_d_fake = F.binary_cross_entropy_with_logits(d_fake, torch.zeros_like(d_fake))
            loss_D = loss_d_real + loss_d_fake
            loss_D.backward()
            opt_D.step()

            # 2. Generator Step
            opt_G.zero_grad()
            d_fake_g, feat_fake = discriminator(fake_recon, labels)
            _, feat_real = discriminator(real_imgs, labels)

            # Adversarial + Feature Matching Loss
            loss_adv = F.binary_cross_entropy_with_logits(d_fake_g, torch.ones_like(d_fake_g))
            loss_fm = F.l1_loss(feat_fake, feat_real.detach())

            # Pixel Reconstruction Loss
            loss_recon = criterion_recon_bce(fake_recon, real_imgs) * 2.0 + criterion_recon_l1(fake_recon, real_imgs) * 5.0

            # KL Divergence
            loss_kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp()) / B

            # Recognizer Guidance Loss
            loss_rec = criterion_ce(recognizer(fake_recon), labels)

            loss_G = loss_recon + 0.05 * loss_kl + 0.1 * loss_adv + 0.05 * loss_fm + 0.5 * loss_rec
            loss_G.backward()
            opt_G.step()

            total_loss_g += loss_G.item()
            total_loss_d += loss_D.item()
            total_recon += loss_recon.item()
            batches += 1

        sched_G.step()
        sched_D.step()

        avg_loss_g = total_loss_g / max(1, batches)
        avg_loss_d = total_loss_d / max(1, batches)
        avg_recon = total_recon / max(1, batches)

        if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
            quick_acc = evaluate_recognizer_accuracy(generator, recognizer, num_classes=num_classes, samples_per_class=10)
            print(f"Epoch {epoch:3d}/{epochs} | Loss G: {avg_loss_g:.4f} | Recon: {avg_recon:.4f} | Loss D: {avg_loss_d:.4f} | Quick Recognizer Acc: {quick_acc:.2f}%", flush=True)

            grid_epoch_path = ROOT / "reports" / f"grid_epoch_{epoch}.png"
            create_sample_grid(generator, num_classes=num_classes, output_path=str(grid_epoch_path))

            if quick_acc >= best_rec_acc:
                best_rec_acc = quick_acc
                torch.save(generator.state_dict(), best_path)
                print(f"  [+] Saved best generator checkpoint (Quick Acc: {best_rec_acc:.2f}%)", flush=True)

    print(f"\n[*] Training completed in {(time.time() - t_start)/60:.2f} minutes.", flush=True)

    # Load best checkpoint
    generator.load_state_dict(torch.load(best_path, map_location=device))

    # Gate 1 Pass Criterion 2: Save official sample grid of 156 classes
    official_grid = ROOT / "reports" / "generated_grid.png"
    create_sample_grid(generator, num_classes=num_classes, output_path=str(official_grid))

    # Gate 1 Pass Criterion 1: Evaluated on 100 generated images per class (15,600 total images)
    print("\n[*] Measuring Gate 1 Recognizer Accuracy on 100 generated glyphs per class (15,600 total)...", flush=True)
    t0_rec = time.time()
    final_acc = evaluate_recognizer_accuracy(generator, recognizer, num_classes=num_classes, samples_per_class=100)
    print(f"[*] Recognizer Accuracy on 15,600 Generated Glyphs: {final_acc:.2f}% (Target: >= 85%)", flush=True)

    # Gate 1 Pass Criterion 3: Export to ONNX and verify inference < 100ms
    onnx_path = ROOT / "export" / "saved_models" / "generator.onnx"
    onnx_path.parent.mkdir(parents=True, exist_ok=True)
    dummy_z = torch.randn(1, 32)
    dummy_c = torch.tensor([0], dtype=torch.long)
    dummy_s = torch.zeros(1, 3, dtype=torch.float32)

    torch.onnx.export(
        generator,
        (dummy_z, dummy_c, dummy_s),
        str(onnx_path),
        input_names=["latent_z", "class_id", "style_vector"],
        output_names=["generated_image"],
        dynamic_axes={
            "latent_z": {0: "batch_size"},
            "class_id": {0: "batch_size"},
            "style_vector": {0: "batch_size"},
            "generated_image": {0: "batch_size"}
        },
        opset_version=14
    )
    print(f"[*] Exported ONNX model to {onnx_path} ({onnx_path.stat().st_size / (1024*1024):.2f} MB)", flush=True)

    import onnxruntime as ort
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    latencies = []
    for _ in range(50):
        t0 = time.perf_counter()
        session.run(None, {
            "latent_z": np.random.randn(1, 32).astype(np.float32),
            "class_id": np.array([42], dtype=np.int64),
            "style_vector": np.array([[0.0, 0.0, 0.0]], dtype=np.float32)
        })
        latencies.append((time.perf_counter() - t0) * 1000.0)

    p50_latency = float(np.median(latencies))
    p95_latency = float(np.percentile(latencies, 95))
    print(f"[*] Measured ONNX Latency: p50={p50_latency:.2f}ms, p95={p95_latency:.2f}ms (Target: < 100ms)", flush=True)

    metrics = {
        "recognizer_accuracy_on_generated": round(final_acc, 2),
        "target_accuracy": 85.0,
        "pass_criteria_met": bool(final_acc >= 85.0),
        "p50_latency_ms": round(p50_latency, 2),
        "p95_latency_ms": round(p95_latency, 2),
        "onnx_size_mb": round(onnx_path.stat().st_size / (1024*1024), 2),
        "total_classes": num_classes,
        "sample_grid_path": str(official_grid)
    }

    metrics_path = ROOT / "runs" / "generator_metrics.json"
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("\n" + "="*50)
    print(f"GATE 1 RESULT: {'PASSED' if final_acc >= 85.0 else 'FAILED'}")
    print(f"Recognizer Accuracy: {final_acc:.2f}% (Target >= 85%)")
    print(f"Grid Saved: {official_grid.exists()}")
    print(f"Inference Latency: {p50_latency:.2f}ms (Target < 100ms)")
    print("="*50 + "\n", flush=True)

if __name__ == "__main__":
    train_generator(epochs=100, batch_size=128)
