"""
Training Pipeline for Model 5: Handwriting Quality Scorer.
Trains Siamese CNN comparing user-drawn variations against canonical class prototype templates.
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

def train_scorer(config_path: str, epochs: int = None, quick: bool = False):
    import torch
    import torch.nn as nn
    from torch.utils.data import TensorDataset, DataLoader
    from scorer import QualityScorerCNN

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Model 5 (Quality Scorer) on device: {device}")

    data_path = ML_DIR / "data" / "processed" / "tamil_dataset.npz"
    data = np.load(data_path)
    X_train = torch.from_numpy(data["X_train"]).float()
    y_train = torch.from_numpy(data["y_train"]).long()

    # Precompute reference prototypes (mean per class)
    num_classes = 156
    prototypes = torch.zeros(num_classes, 1, 64, 64)
    for c in range(num_classes):
        mask = (y_train == c)
        if mask.sum() > 0:
            prototypes[c] = X_train[mask].mean(dim=0)
        else:
            prototypes[c] = X_train[0]

    model = QualityScorerCNN().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg["training"]["lr"])
    criterion = nn.MSELoss()

    num_epochs = epochs or (cfg["training"]["quick_epochs"] if quick else cfg["training"]["epochs"])
    ckpt_dir = ML_DIR / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    print(f"[*] Training Quality Scorer for {num_epochs} epochs...")
    model.train()
    for epoch in range(1, num_epochs + 1):
        total_loss = 0.0
        # Sample mini-batches
        indices = torch.randperm(len(X_train))[:128]
        batch_u = X_train[indices].to(device)
        batch_labels = y_train[indices]
        batch_ref = prototypes[batch_labels].to(device)

        # Synthetic target quality based on L2 distance
        diff = ((batch_u - batch_ref) ** 2).mean(dim=[1, 2, 3])
        target_score = torch.clamp((1.0 - diff * 4.0) * 100.0, min=20.0, max=98.0).unsqueeze(1)

        optimizer.zero_grad()
        out = model(batch_u, batch_ref)
        loss = criterion(out["overall"], target_score)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

        print(f"Epoch [{epoch:02d}/{num_epochs:02d}] Scorer Loss: {total_loss:.4f}")

    torch.save(model.state_dict(), ckpt_dir / "scorer_best.pt")
    # Also save class prototype templates tensor for inference scoring
    torch.save(prototypes, ckpt_dir / "class_prototypes.pt")
    print(f"[+] Saved scorer checkpoint and class prototypes to {ckpt_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default=str(ML_DIR / "configs" / "scorer.yaml"))
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--quick", action="store_true")
    args = parser.parse_args()

    train_scorer(args.config, epochs=args.epochs, quick=args.quick)
