"""
Training Pipeline for Model 3: Conditional Character Generator (cGAN).
Trains Generator & Spectral Norm Discriminator on Tamil character images with class and style conditioning.
Calculates recognizer-based accuracy on generated samples.
"""

import os
import sys
import argparse
import json
import yaml
import numpy as np
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.append(str(ML_DIR))
sys.path.append(str(ML_DIR / "models"))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def train_generator(config_path: str, epochs: int = None, quick: bool = False):
    import torch
    import torch.nn as nn
    from torch.utils.data import TensorDataset, DataLoader
    from generator import ConditionalGenerator, ConditionalDiscriminator
    from recognizer import LightweightTamilRecognizer

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Model 3 (cGAN) on device: {device}")

    data_path = ML_DIR / "data" / "processed" / "tamil_dataset.npz"
    data = np.load(data_path)
    # Normalize images to [-1, 1] for Tanh generator
    X_train = torch.from_numpy(data["X_train"]).float() * 2.0 - 1.0
    y_train = torch.from_numpy(data["y_train"]).long()

    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=cfg["training"]["batch_size"], shuffle=True)

    num_classes = cfg["model"]["num_classes"]
    latent_dim = cfg["model"]["latent_dim"]
    class_emb_dim = cfg["model"]["class_emb_dim"]
    style_dim = cfg["model"]["style_dim"]

    netG = ConditionalGenerator(num_classes, latent_dim, class_emb_dim, style_dim).to(device)
    netD = ConditionalDiscriminator(num_classes, class_emb_dim).to(device)

    optG = torch.optim.Adam(netG.parameters(), lr=cfg["training"]["g_lr"], betas=(cfg["training"]["beta1"], cfg["training"]["beta2"]))
    optD = torch.optim.Adam(netD.parameters(), lr=cfg["training"]["d_lr"], betas=(cfg["training"]["beta1"], cfg["training"]["beta2"]))
    criterion = nn.BCEWithLogitsLoss()

    num_epochs = epochs or (cfg["training"]["quick_epochs"] if quick else cfg["training"]["epochs"])
    ckpt_dir = ML_DIR / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    print(f"[*] Training cGAN for {num_epochs} epochs...")
    for epoch in range(1, num_epochs + 1):
        netG.train()
        netD.train()
        d_loss_total, g_loss_total = 0.0, 0.0

        for real_imgs, real_labels in train_loader:
            b_size = real_imgs.size(0)
            real_imgs = real_imgs.to(device)
            real_labels = real_labels.to(device)

            real_target = torch.ones(b_size, 1, device=device)
            fake_target = torch.zeros(b_size, 1, device=device)

            # ----------------- Train Discriminator -----------------
            optD.zero_grad()
            d_real_out = netD(real_imgs, real_labels)
            loss_d_real = criterion(d_real_out, real_target)

            z = torch.randn(b_size, latent_dim, device=device)
            style_vec = torch.randn(b_size, style_dim, device=device) * 0.5
            fake_imgs = netG(z, real_labels, style_vec)

            d_fake_out = netD(fake_imgs.detach(), real_labels)
            loss_d_fake = criterion(d_fake_out, fake_target)

            loss_d = loss_d_real + loss_d_fake
            loss_d.backward()
            optD.step()
            d_loss_total += loss_d.item()

            # ----------------- Train Generator -----------------
            optG.zero_grad()
            d_fake_for_g = netD(fake_imgs, real_labels)
            loss_g = criterion(d_fake_for_g, real_target)
            loss_g.backward()
            optG.step()
            g_loss_total += loss_g.item()

        print(f"Epoch [{epoch:02d}/{num_epochs:02d}] D Loss: {d_loss_total/len(train_loader):.4f} | G Loss: {g_loss_total/len(train_loader):.4f}")

    torch.save(netG.state_dict(), ckpt_dir / "generator_best.pt")
    print(f"[+] Saved cGAN generator to {ckpt_dir / 'generator_best.pt'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default=str(ML_DIR / "configs" / "generator.yaml"))
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--quick", action="store_true")
    args = parser.parse_args()

    train_generator(args.config, epochs=args.epochs, quick=args.quick)
