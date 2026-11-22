"""
Model 7: Writer Style Encoder.
Extracts a continuous writer-specific style embedding vector (dim=32)
from 1 to 5 user-provided sample drawn character glyphs.
Conditioning vector guides:
- Slant and aspect ratio
- Stroke thickness and velocity profile
- Curvature and corner sharpness
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class WriterStyleEncoder(nn.Module):
    """
    Siamese / Few-shot style feature encoder.
    Input: (B, N_samples, 1, 64, 64) -> 1 to 5 sample images drawn by writer.
    Output: (B, style_dim) -> e.g. 32-dimensional normalized style embedding.
    """
    def __init__(self, style_dim: int = 32):
        super().__init__()
        self.style_dim = style_dim

        self.conv_net = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=4, stride=2, padding=1),  # 32x32
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.2, inplace=True),

            nn.Conv2d(32, 64, kernel_size=4, stride=2, padding=1),  # 16x16
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.2, inplace=True),

            nn.Conv2d(64, 128, kernel_size=4, stride=2, padding=1), # 8x8
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2, inplace=True),

            nn.AdaptiveAvgPool2d((2, 2)),
            nn.Flatten()
        )

        self.proj = nn.Sequential(
            nn.Linear(128 * 4, 128),
            nn.ReLU(True),
            nn.Linear(128, style_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x can be:
        (B, 1, 64, 64) -> Single sample
        or (B, N, 1, 64, 64) -> Multiple samples
        """
        if x.dim() == 5:
            b, n, c, h, w = x.shape
            x = x.view(b * n, c, h, w)
            feats = self.conv_net(x)
            embs = self.proj(feats).view(b, n, self.style_dim)
            # Mean pool over the writer's samples
            writer_emb = torch.mean(embs, dim=1)
        else:
            feats = self.conv_net(x)
            writer_emb = self.proj(feats)

        # L2 normalize style embedding
        return F.normalize(writer_emb, p=2, dim=-1)
