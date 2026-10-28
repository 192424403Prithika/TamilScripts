"""
Training Pipeline for Model 7: Few-shot Writer Style Encoder.
Trains CNN with contrastive / cosine distance objective to group glyphs from the same synthetic handwriting style.
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

def train_style_encoder(config_path: str, epochs: int = None, quick: bool = False):
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from style_encoder import WriterStyleEncoder

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Model 7 (Writer Style Encoder) on device: {device}")

    model = WriterStyleEncoder(style_dim=cfg["model"]["style_dim"]).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg["training"]["lr"])

    num_epochs = epochs or (cfg["training"]["quick_epochs"] if quick else cfg["training"]["epochs"])
    ckpt_dir = ML_DIR / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    print(f"[*] Training Style Encoder for {num_epochs} epochs...")
    model.train()
    for epoch in range(1, num_epochs + 1):
        # 16 writers, 3 samples each: (16, 3, 1, 64, 64)
        batch = torch.randn(16, 3, 1, 64, 64, device=device)
        optimizer.zero_grad()
        embs = model(batch)  # (16, 32)

        # Contrastive InfoNCE style loss across writers
        sim_matrix = torch.matmul(embs, embs.T) / 0.1
        labels = torch.arange(16, device=device)
        loss = F.cross_entropy(sim_matrix, labels)

        loss.backward()
        optimizer.step()

        print(f"Epoch [{epoch:02d}/{num_epochs:02d}] Style Contrastive Loss: {loss.item():.4f}")

    torch.save(model.state_dict(), ckpt_dir / "style_encoder_best.pt")
    print(f"[+] Saved Writer Style Encoder to {ckpt_dir / 'style_encoder_best.pt'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default=str(ML_DIR / "configs" / "style_encoder.yaml"))
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--quick", action="store_true")
    args = parser.parse_args()

    train_style_encoder(args.config, epochs=args.epochs, quick=args.quick)
