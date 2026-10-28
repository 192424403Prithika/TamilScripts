"""
Model 3: Conditional Character Generator (cGAN with Spectral Normalization & DDIM-compatible U-Net).
Generates handwritten Tamil character images conditioned on:
- Class index (0 to 155)
- Continuous style vector (slant, stroke thickness, writer style)
- Latent noise z (with seed reproducibility)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class ConditionalGenerator(nn.Module):
    """
    cGAN Generator:
    Input: Latent vector z (dim=64) + class embedding (dim=32) + style vector (dim=4: slant, thickness, curvature, pressure)
    Output: (B, 1, 64, 64) Grayscale character image in [-1, 1] range.
    """
    def __init__(self, num_classes: int = 156, latent_dim: int = 64, class_emb_dim: int = 32, style_dim: int = 4):
        super().__init__()
        self.class_emb = nn.Embedding(num_classes, class_emb_dim)
        in_dim = latent_dim + class_emb_dim + style_dim

        self.fc = nn.Sequential(
            nn.Linear(in_dim, 256 * 4 * 4),
            nn.BatchNorm1d(256 * 4 * 4),
            nn.ReLU(True)
        )

        # 4x4 -> 8x8
        self.deconv1 = nn.Sequential(
            nn.ConvTranspose2d(256, 128, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(True)
        )

        # 8x8 -> 16x16
        self.deconv2 = nn.Sequential(
            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(True)
        )

        # 16x16 -> 32x32
        self.deconv3 = nn.Sequential(
            nn.ConvTranspose2d(64, 32, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(True)
        )

        # 32x32 -> 64x64
        self.deconv4 = nn.Sequential(
            nn.ConvTranspose2d(32, 1, kernel_size=4, stride=2, padding=1, bias=False),
            nn.Tanh()
        )

    def forward(self, z: torch.Tensor, class_idx: torch.Tensor, style_vec: torch.Tensor) -> torch.Tensor:
        c = self.class_emb(class_idx)
        x = torch.cat([z, c, style_vec], dim=-1)
        h = self.fc(x).view(-1, 256, 4, 4)
        h = self.deconv1(h)
        h = self.deconv2(h)
        h = self.deconv3(h)
        img = self.deconv4(h)
        return img

class ConditionalDiscriminator(nn.Module):
    """
    cGAN Discriminator with Spectral Normalization for stable training.
    """
    def __init__(self, num_classes: int = 156, class_emb_dim: int = 32):
        super().__init__()
        self.class_emb = nn.Embedding(num_classes, class_emb_dim)
        self.class_proj = nn.Linear(class_emb_dim, 64 * 64)

        self.net = nn.Sequential(
            nn.utils.spectral_norm(nn.Conv2d(2, 32, 4, 2, 1)),  # 32x32
            nn.LeakyReLU(0.2, inplace=True),
            nn.utils.spectral_norm(nn.Conv2d(32, 64, 4, 2, 1)),  # 16x16
            nn.LeakyReLU(0.2, inplace=True),
            nn.utils.spectral_norm(nn.Conv2d(64, 128, 4, 2, 1)), # 8x8
            nn.LeakyReLU(0.2, inplace=True),
            nn.utils.spectral_norm(nn.Conv2d(128, 256, 4, 2, 1)), # 4x4
            nn.LeakyReLU(0.2, inplace=True),
            nn.Flatten(),
            nn.Linear(256 * 4 * 4, 1)
        )

    def forward(self, img: torch.Tensor, class_idx: torch.Tensor) -> torch.Tensor:
        b = img.shape[0]
        c = self.class_emb(class_idx)
        c_map = self.class_proj(c).view(b, 1, 64, 64)
        x = torch.cat([img, c_map], dim=1)
        return self.net(x)
