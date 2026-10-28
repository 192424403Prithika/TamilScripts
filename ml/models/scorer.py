"""
Model 5: Handwriting Quality Scorer.
Siamese CNN architecture with multi-task regression heads:
- Similarity to ground truth template (0-100 quality score)
- Proportional aspect fidelity (0-100)
- Loop closure and stroke smoothness score (0-100)
- Diagnostic feedback generator based on neural latent distance
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any

class QualityScorerCNN(nn.Module):
    """
    Siamese CNN that processes:
    1. User's drawn glyph (1, 64, 64)
    2. Canonical prototype template glyph (1, 64, 64)
    Outputs:
    - Overall score (0-100)
    - Proportions score (0-100)
    - Loop closure & continuity score (0-100)
    - Smoothness score (0-100)
    """
    def __init__(self):
        super().__init__()
        # Shared feature extractor
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(True),
            nn.MaxPool2d(2, 2),  # 32x32

            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(True),
            nn.MaxPool2d(2, 2),  # 16x16

            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(True),
            nn.AdaptiveAvgPool2d((4, 4)),  # 4x4
            nn.Flatten()
        )

        # Multi-task evaluation heads
        feat_dim = 128 * 4 * 4 * 2  # Concat user + reference
        self.fc_overall = nn.Sequential(
            nn.Linear(feat_dim, 128),
            nn.ReLU(True),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )

        self.fc_proportions = nn.Sequential(
            nn.Linear(feat_dim, 64),
            nn.ReLU(True),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        self.fc_loops = nn.Sequential(
            nn.Linear(feat_dim, 64),
            nn.ReLU(True),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        self.fc_smoothness = nn.Sequential(
            nn.Linear(feat_dim, 64),
            nn.ReLU(True),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, user_img: torch.Tensor, ref_img: torch.Tensor):
        feat_u = self.encoder(user_img)
        feat_r = self.encoder(ref_img)
        combined = torch.cat([feat_u, feat_r], dim=-1)

        overall = self.fc_overall(combined) * 100.0
        proportions = self.fc_proportions(combined) * 100.0
        loops = self.fc_loops(combined) * 100.0
        smoothness = self.fc_smoothness(combined) * 100.0

        return {
            "overall": overall,
            "proportions": proportions,
            "loops": loops,
            "smoothness": smoothness
        }

    def generate_feedback(self, scores: Dict[str, float], char_name: str) -> str:
        overall = scores["overall"]
        loops = scores["loops"]
        proportions = scores["proportions"]

        tips = []
        if overall >= 90:
            tips.append(f"Exemplary handwriting for '{char_name}'! Beautiful stroke balance and clarity.")
        elif overall >= 75:
            tips.append(f"Well formed '{char_name}'. Clear glyph anatomy.")
        else:
            tips.append(f"Needs practice for '{char_name}'.")

        if loops < 70:
            tips.append("Ensure your inner circular loops and curves are cleanly closed.")
        if proportions < 70:
            tips.append("Pay attention to vertical and horizontal aspect ratios.")
            
        return " ".join(tips)
