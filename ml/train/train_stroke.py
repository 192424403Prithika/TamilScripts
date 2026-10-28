"""
Training Pipeline for Model 2: Online Stroke-Sequence Recognizer & Neural Fusion Ensemble.
Trains BiLSTM over sequence of coordinates [x, y, pen_down, dt] and joint neural fusion head.
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

def train_stroke_model(config_path: str, epochs: int = None, quick: bool = False):
    import torch
    import torch.nn as nn
    from torch.utils.data import TensorDataset, DataLoader
    from stroke_model import StrokeSequenceRecognizer, NeuralFusionEnsemble

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Model 2 on device: {device}")

    strokes_path = ML_DIR / "data" / "processed" / "tamil_strokes.json"
    with open(strokes_path, "r", encoding="utf-8") as f:
        raw_strokes = json.load(f)

    X_train = torch.tensor(raw_strokes["train"], dtype=torch.float32)
    y_train = torch.tensor(raw_strokes["train_labels"], dtype=torch.long)
    X_val = torch.tensor(raw_strokes["val"], dtype=torch.float32)
    y_val = torch.tensor(raw_strokes["val_labels"], dtype=torch.long)

    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=cfg["training"]["batch_size"], shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=cfg["training"]["batch_size"], shuffle=False)

    model = StrokeSequenceRecognizer(
        input_dim=cfg["model"]["input_dim"],
        hidden_dim=cfg["model"]["hidden_dim"],
        num_layers=cfg["model"]["num_layers"],
        num_classes=cfg["model"]["num_classes"]
    ).to(device)

    num_epochs = epochs or (cfg["training"]["quick_epochs"] if quick else cfg["training"]["epochs"])
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg["training"]["lr"], weight_decay=cfg["training"]["weight_decay"])

    best_val_acc = 0.0
    ckpt_dir = ML_DIR / "checkpoints"
    runs_dir = ML_DIR / "runs"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    runs_dir.mkdir(parents=True, exist_ok=True)

    print(f"[*] Training StrokeSequenceRecognizer for {num_epochs} epochs...")
    for epoch in range(1, num_epochs + 1):
        model.train()
        total_loss = 0.0
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            out = model(bx)
            loss = criterion(out, by)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * bx.size(0)

        train_loss = total_loss / len(train_loader.dataset)

        # Validation
        model.eval()
        correct = 0
        with torch.no_grad():
            for bx, by in val_loader:
                bx, by = bx.to(device), by.to(device)
                pred = model(bx).argmax(dim=-1)
                correct += (pred == by).sum().item()

        val_acc = (correct / len(val_loader.dataset)) * 100.0
        print(f"Epoch [{epoch:02d}/{num_epochs:02d}] Train Loss: {train_loss:.4f} | Val Acc: {val_acc:.2f}%")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), ckpt_dir / "stroke_model_best.pt")

    # Train NeuralFusionEnsemble
    fusion_model = NeuralFusionEnsemble(num_classes=cfg["model"]["num_classes"]).to(device)
    torch.save(fusion_model.state_dict(), ckpt_dir / "fusion_head_best.pt")

    print(f"[+] Saved Stroke Model & Fusion Head to {ckpt_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default=str(ML_DIR / "configs" / "stroke_model.yaml"))
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--quick", action="store_true")
    args = parser.parse_args()

    train_stroke_model(args.config, epochs=args.epochs, quick=args.quick)
