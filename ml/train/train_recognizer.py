"""
Training Pipeline for Model 1: Real-time Tamil Character Recognizer.
- Squeeze-and-Excitation Residual CNN
- CosineAnnealingLR Schedule + AdamW
- Label Smoothing Cross Entropy
- Top-1 and Top-5 accuracy evaluation
- Saves best weights and generates training history JSON
"""

import os
import sys
import argparse
import json
import yaml
import numpy as np
from pathlib import Path

# Add project roots to path
CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.append(str(ML_DIR))
sys.path.append(str(ML_DIR / "models"))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def train_recognizer(config_path: str, epochs: int = None, quick: bool = False):
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch.utils.data import TensorDataset, DataLoader
    from recognizer import LightweightTamilRecognizer, BaselineCNN, EfficientTamilNet

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Model 1 on device: {device}")

    # Load prepared dataset
    data_path = ML_DIR / "data" / "processed" / "tamil_dataset.npz"
    if not data_path.exists():
        from data.prepare import prepare_dataset
        prepare_dataset(samples_per_class=20)

    data = np.load(data_path)
    X_train = torch.from_numpy(data["X_train"]).float()
    y_train = torch.from_numpy(data["y_train"]).long()

    X_val = torch.from_numpy(data["X_val"]).float()
    y_val = torch.from_numpy(data["y_val"]).long()

    X_test = torch.from_numpy(data["X_test"]).float()
    y_test = torch.from_numpy(data["y_test"]).long()

    batch_size = cfg["training"]["batch_size"]
    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(TensorDataset(X_test, y_test), batch_size=batch_size, shuffle=False)

    num_classes = cfg["model"]["num_classes"]
    model = LightweightTamilRecognizer(num_classes=num_classes).to(device)

    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[*] Model Parameter Count: {total_params:,} (~{total_params * 4 / (1024*1024):.2f} MB float32)")

    num_epochs = epochs or (cfg["training"]["quick_epochs"] if quick else cfg["training"]["epochs"])
    criterion = nn.CrossEntropyLoss(label_smoothing=cfg["training"]["label_smoothing"])
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg["training"]["lr"], weight_decay=cfg["training"]["weight_decay"])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=cfg["training"]["min_lr"])

    ckpt_dir = ML_DIR / "checkpoints"
    runs_dir = ML_DIR / "runs"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    runs_dir.mkdir(parents=True, exist_ok=True)

    best_val_acc = 0.0
    history = {"train_loss": [], "val_loss": [], "val_acc": [], "val_top5_acc": []}

    print(f"[*] Commencing training for {num_epochs} epochs...")
    for epoch in range(1, num_epochs + 1):
        model.train()
        running_loss = 0.0
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            logits = model(bx)
            loss = criterion(logits, by)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * bx.size(0)

        scheduler.step()
        train_loss = running_loss / len(train_loader.dataset)

        # Validation
        model.eval()
        val_loss, correct_top1, correct_top5 = 0.0, 0, 0
        with torch.no_grad():
            for bx, by in val_loader:
                bx, by = bx.to(device), by.to(device)
                logits = model(bx)
                loss = criterion(logits, by)
                val_loss += loss.item() * bx.size(0)

                # Top-1 & Top-5
                probs = F.softmax(logits, dim=-1)
                _, pred_top5 = torch.topk(probs, k=5, dim=-1)
                correct_top1 += (pred_top5[:, 0] == by).sum().item()
                correct_top5 += (pred_top5 == by.unsqueeze(1)).any(dim=-1).sum().item()

        val_loss /= len(val_loader.dataset)
        val_acc = (correct_top1 / len(val_loader.dataset)) * 100.0
        val_top5_acc = (correct_top5 / len(val_loader.dataset)) * 100.0

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["val_top5_acc"].append(val_top5_acc)

        print(f"Epoch [{epoch:02d}/{num_epochs:02d}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | Top-5: {val_top5_acc:.2f}%", flush=True)

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), ckpt_dir / "recognizer_best.pt")

    # Final Test evaluation
    model.eval()
    test_top1, test_top5 = 0, 0
    with torch.no_grad():
        for bx, by in test_loader:
            bx, by = bx.to(device), by.to(device)
            logits = model(bx)
            probs = F.softmax(logits, dim=-1)
            _, pred_top5 = torch.topk(probs, k=5, dim=-1)
            test_top1 += (pred_top5[:, 0] == by).sum().item()
            test_top5 += (pred_top5 == by.unsqueeze(1)).any(dim=-1).sum().item()

    test_acc = (test_top1 / len(test_loader.dataset)) * 100.0
    test_top5_acc = (test_top5 / len(test_loader.dataset)) * 100.0
    print(f"\n[+] Final Test Evaluation -> Top-1 Acc: {test_acc:.2f}% | Top-5 Acc: {test_top5_acc:.2f}%")

    # Save metrics log
    metrics = {
        "model_name": "LightweightTamilRecognizer",
        "num_classes": num_classes,
        "param_count": total_params,
        "best_val_accuracy": best_val_acc,
        "test_top1_accuracy": test_acc,
        "test_top5_accuracy": test_top5_acc,
        "history": history
    }
    with open(runs_dir / "recognizer_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"[+] Saved model checkpoint to {ckpt_dir / 'recognizer_best.pt'}")
    return model, metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default=str(ML_DIR / "configs" / "recognizer.yaml"))
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--quick", action="store_true")
    args = parser.parse_args()

    train_recognizer(args.config, epochs=args.epochs, quick=args.quick)
