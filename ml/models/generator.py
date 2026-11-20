"""
Model 3: Conditional Character Generator (Conditional VAE-GAN with Spectral Normalization).
Generates handwritten Tamil character images conditioned on:
- Class index (0 to 155)
- Continuous style vector (slant, stroke thickness, neatness)
- Latent noise z (with seed reproducibility)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class ConditionalGenerator(nn.Module):
    """
    Conditional Generator (Decoder):
    Input:
      - Latent vector z (dim=32)
      - Class index (0..155) embedded to dim=32
      - Style vector [slant, thickness, neatness] (dim=3)
    Output:
      - (B, 1, 64, 64) in [0.0, 1.0] representing ink density.
    """
    def __init__(self, num_classes: int = 156, latent_dim: int = 32, class_emb_dim: int = 32, style_dim: int = 3):
        super().__init__()
        self.latent_dim = latent_dim
        self.num_classes = num_classes
        self.class_emb = nn.Embedding(num_classes, class_emb_dim)
        in_dim = latent_dim + class_emb_dim + style_dim

        self.fc = nn.Sequential(
            nn.Linear(in_dim, 128 * 4 * 4),
            nn.BatchNorm1d(128 * 4 * 4),
            nn.ReLU(True)
        )

        # 4x4 -> 8x8
        self.deconv1 = nn.Sequential(
            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(True)
        )

        # 8x8 -> 16x16
        self.deconv2 = nn.Sequential(
            nn.ConvTranspose2d(64, 32, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(True)
        )

        # 16x16 -> 32x32
        self.deconv3 = nn.Sequential(
            nn.ConvTranspose2d(32, 16, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(16),
            nn.ReLU(True)
        )

        # 32x32 -> 64x64
        self.deconv4 = nn.Sequential(
            nn.ConvTranspose2d(16, 1, kernel_size=4, stride=2, padding=1, bias=False),
            nn.Sigmoid()
        )

    def forward(self, z: torch.Tensor, class_idx: torch.Tensor, style_vec: torch.Tensor) -> torch.Tensor:
        c = self.class_emb(class_idx)
        x = torch.cat([z, c, style_vec], dim=-1)
        h = self.fc(x).view(-1, 128, 4, 4)
        h = self.deconv1(h)
        h = self.deconv2(h)
        h = self.deconv3(h)
        img = self.deconv4(h)
        return img

    def generate(self, z: torch.Tensor, class_idx: torch.Tensor, style_vec: torch.Tensor) -> torch.Tensor:
        return self.forward(z, class_idx, style_vec)

class ConditionalEncoder(nn.Module):
    """
    Conditional Encoder for C-VAE training:
    Encodes image (1, 64, 64) + class embedding + style vector -> (mu, logvar).
    """
    def __init__(self, num_classes: int = 156, latent_dim: int = 32, class_emb_dim: int = 32, style_dim: int = 3):
        super().__init__()
        self.class_emb = nn.Embedding(num_classes, class_emb_dim)

        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=4, stride=2, padding=1), # 32x32
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.2, True),

            nn.Conv2d(32, 64, kernel_size=4, stride=2, padding=1), # 16x16
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.2, True),

            nn.Conv2d(64, 128, kernel_size=4, stride=2, padding=1), # 8x8
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2, True),

            nn.Conv2d(128, 128, kernel_size=4, stride=2, padding=1), # 4x4
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2, True),

            nn.Flatten() # 128*4*4 = 2048
        )

        in_fc = 2048 + class_emb_dim + style_dim
        self.fc_mu = nn.Linear(in_fc, latent_dim)
        self.fc_logvar = nn.Linear(in_fc, latent_dim)

    def forward(self, x: torch.Tensor, class_idx: torch.Tensor, style_vec: torch.Tensor):
        feat = self.conv(x)
        c = self.class_emb(class_idx)
        inp = torch.cat([feat, c, style_vec], dim=-1)
        mu = self.fc_mu(inp)
        logvar = self.fc_logvar(inp)
        return mu, logvar

class ConditionalDiscriminator(nn.Module):
    """
    Projection Discriminator with Spectral Normalization (Miyato et al.).
    """
    def __init__(self, num_classes: int = 156, class_emb_dim: int = 32):
        super().__init__()
        self.class_emb = nn.Embedding(num_classes, class_emb_dim)

        self.conv = nn.Sequential(
            nn.utils.spectral_norm(nn.Conv2d(1, 32, 4, 2, 1)), # 32x32
            nn.LeakyReLU(0.2, True),
            nn.utils.spectral_norm(nn.Conv2d(32, 64, 4, 2, 1)), # 16x16
            nn.LeakyReLU(0.2, True),
            nn.utils.spectral_norm(nn.Conv2d(64, 128, 4, 2, 1)), # 8x8
            nn.LeakyReLU(0.2, True),
            nn.utils.spectral_norm(nn.Conv2d(128, 128, 4, 2, 1)), # 4x4
            nn.LeakyReLU(0.2, True),
            nn.Flatten() # 2048
        )
        self.fc = nn.utils.spectral_norm(nn.Linear(2048, 1))
        self.proj = nn.Linear(class_emb_dim, 2048)

    def forward(self, img: torch.Tensor, class_idx: torch.Tensor):
        feat = self.conv(img)
        score = self.fc(feat)
        c = self.class_emb(class_idx)
        score = score + torch.sum(feat * self.proj(c), dim=-1, keepdim=True)
        return score, feat
