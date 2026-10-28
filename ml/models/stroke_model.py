"""
Model 2: Online Stroke-Sequence Recognizer & Neural Fusion Ensemble.
1. StrokeSequenceRecognizer: Bi-directional LSTM / Transformer encoder over (x, y, pen_down, dt).
2. NeuralFusionHead: Small MLP that fuses image logits from Model 1 and stroke logits from Model 2 into calibrated joint predictions.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class StrokeSequenceRecognizer(nn.Module):
    """
    Classifies a character from live pen strokes.
    Input: (B, Seq_Len, 4) -> features: [x, y, pen_down, time_delta]
    Output: Logits for 156 character classes.
    """
    def __init__(self, input_dim: int = 4, hidden_dim: int = 128, num_layers: int = 2, num_classes: int = 156):
        super().__init__()
        self.input_proj = nn.Linear(input_dim, 64)
        self.lstm = nn.LSTM(
            input_size=64,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.2 if num_layers > 1 else 0.0
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, L, 4)
        emb = F.relu(self.input_proj(x))
        out, (hn, _) = self.lstm(emb)
        # Global max pooling over sequence length
        pooled = torch.max(out, dim=1)[0]
        logits = self.fc(pooled)
        return logits

class NeuralFusionEnsemble(nn.Module):
    """
    Learned neural ensemble that fuses Model 1 (image-based) and Model 2 (stroke-based) logits.
    Instead of static weights, this neural gate dynamically weights modalities
    based on input confidence and stroke density.
    """
    def __init__(self, num_classes: int = 156):
        super().__init__()
        # Concatenate 156 + 156 logits -> 312
        self.fusion_gate = nn.Sequential(
            nn.Linear(num_classes * 2, 64),
            nn.ReLU(),
            nn.Linear(64, 2),
            nn.Softmax(dim=-1)
        )
        self.residual_head = nn.Sequential(
            nn.Linear(num_classes * 2, num_classes),
            nn.Tanh()
        )

    def forward(self, img_logits: torch.Tensor, stroke_logits: torch.Tensor) -> torch.Tensor:
        concat = torch.cat([img_logits, stroke_logits], dim=-1)
        weights = self.fusion_gate(concat)  # (B, 2)
        w_img = weights[:, 0:1]
        w_stroke = weights[:, 1:2]
        
        blended = w_img * img_logits + w_stroke * stroke_logits
        residual = self.residual_head(concat) * 0.1
        return blended + residual
