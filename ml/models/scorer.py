"""
Model 5: Siamese Handwriting Quality Scorer.
Shared CNN encoder trained with contrastive/triplet loss on uTHCD with hard negative mining.
Auxiliary heads for sub-scores: proportions, loop closure, and smoothness.
Calibrated 0-100 score strictly matching sub-scores.
"""

import math
from typing import Dict, Any, List
import torch
import torch.nn as nn
import torch.nn.functional as F

class QualityScorerCNN(nn.Module):
    """
    Siamese CNN that processes:
    1. User's drawn glyph (1, 64, 64)
    2. Reference class prototype embedding (128)
    Outputs:
    - Overall score (0-100) calibrated from Siamese similarity
    - Proportions sub-score (0-100)
    - Loop closure & curve continuity sub-score (0-100)
    - Stroke smoothness sub-score (0-100)
    """
    def __init__(self, emb_dim: int = 128):
        super().__init__()
        self.emb_dim = emb_dim

        # Shared CNN feature extractor
        self.encoder_conv = nn.Sequential(
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
            nn.MaxPool2d(2, 2),  # 8x8

            nn.Conv2d(128, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(True),
            nn.AdaptiveAvgPool2d((4, 4)),  # 4x4
            nn.Flatten() # 128*4*4 = 2048
        )

        self.fc_emb = nn.Linear(2048, emb_dim)

        # Auxiliary heads trained on automatically measured labels
        self.fc_proportions = nn.Sequential(
            nn.Linear(2048, 64),
            nn.ReLU(True),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        self.fc_loops = nn.Sequential(
            nn.Linear(2048, 64),
            nn.ReLU(True),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        self.fc_smoothness = nn.Sequential(
            nn.Linear(2048, 64),
            nn.ReLU(True),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # Calibration parameters for similarity -> 0-100 score
        self.register_buffer("calib_alpha", torch.tensor([8.0]))
        self.register_buffer("calib_tau", torch.tensor([0.45]))

    def encode(self, img: torch.Tensor) -> torch.Tensor:
        feat = self.encoder_conv(img)
        emb = self.fc_emb(feat)
        return F.normalize(emb, p=2, dim=-1)

    def forward_subscores(self, img: torch.Tensor):
        feat = self.encoder_conv(img)
        prop = self.fc_proportions(feat).squeeze(-1) * 100.0
        loops = self.fc_loops(feat).squeeze(-1) * 100.0
        smooth = self.fc_smoothness(feat).squeeze(-1) * 100.0
        return prop, loops, smooth

    def forward_similarity(self, user_img: torch.Tensor, ref_emb: torch.Tensor) -> torch.Tensor:
        user_emb = self.encode(user_img)
        # Cosine similarity between normalized embeddings
        sim = torch.sum(user_emb * ref_emb, dim=-1)
        # Calibrated logistic score in [0, 100]
        calibrated = torch.sigmoid(self.calib_alpha * (sim - self.calib_tau)) * 100.0
        return calibrated

    def forward(self, user_img: torch.Tensor, ref_emb: torch.Tensor):
        prop, loops, smooth = self.forward_subscores(user_img)
        sim_score = self.forward_similarity(user_img, ref_emb)
        # Overall score strictly bounded and mathematically consistent with parts
        overall = 0.55 * sim_score + 0.15 * prop + 0.15 * loops + 0.15 * smooth
        return {
            "overall": overall,
            "proportions": prop,
            "loops": loops,
            "smoothness": smooth,
            "similarity": sim_score
        }

    def generate_feedback(self, scores: Dict[str, float], target_char: str, pred_char: str = None) -> str:
        overall = float(scores["overall"])
        loops = float(scores["loops"])
        props = float(scores["proportions"])
        smooth = float(scores["smoothness"])

        tips = []
        if pred_char and pred_char != target_char:
            tips.append(f"Stroke shape was confused with '{pred_char}' instead of '{target_char}'.")

        if overall >= 85:
            tips.append(f"Excellent execution of '{target_char}'! Clear glyph anatomy and balance.")
        elif overall >= 70:
            tips.append(f"Good attempt for '{target_char}'. Matches standard proportions.")
        else:
            tips.append(f"Keep practicing '{target_char}'.")

        if loops < 70:
            tips.append("Watch circular curve closure and loops.")
        if props < 70:
            tips.append("Adjust height-to-width aspect ratio along the baseline.")
        if smooth < 70:
            tips.append("Maintain steady, continuous pen motion for smoother curves.")

        return " ".join(tips)
