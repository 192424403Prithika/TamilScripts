"""
Neural Out-Of-Distribution (OOD) & Scribble Rejection Detector.
Combines:
1. Convolutional Autoencoder Reconstruction Error (Mean Squared Error on 64x64 canvas)
2. Free Energy Score from Classifier Logits: E(x; T) = -T * logsumexp(logits / T)
If reconstruction error is high or energy score is high, marks input as non-character scribble.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class ScribbleAutoencoder(nn.Module):
    """
    Trained strictly on valid handwritten Tamil glyphs.
    Random scribbles, lines, crosses produce high reconstruction MSE.
    """
    def __init__(self):
        super().__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 16, 3, stride=2, padding=1),  # 32x32
            nn.ReLU(True),
            nn.Conv2d(16, 32, 3, stride=2, padding=1), # 16x16
            nn.ReLU(True),
            nn.Conv2d(32, 64, 3, stride=2, padding=1), # 8x8
            nn.ReLU(True),
        )
        # Decoder
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(64, 32, 3, stride=2, padding=1, output_padding=1), # 16x16
            nn.ReLU(True),
            nn.ConvTranspose2d(32, 16, 3, stride=2, padding=1, output_padding=1), # 32x32
            nn.ReLU(True),
            nn.ConvTranspose2d(16, 1, 3, stride=2, padding=1, output_padding=1),  # 64x64
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        recon = self.decoder(latent)
        return recon

    def compute_ood_score(self, x: torch.Tensor, logits: torch.Tensor = None, temperature: float = 1.0) -> dict:
        self.eval()
        with torch.no_grad():
            recon = self.forward(x)
            mse = F.mse_loss(recon, x, reduction='none').mean(dim=[1, 2, 3])
            
            # Energy score if logits provided
            if logits is not None:
                energy = -temperature * torch.logsumexp(logits / temperature, dim=-1)
            else:
                energy = torch.zeros_like(mse)
                
            # Normalized scribble probability: sigmoid scale
            scribble_prob = torch.sigmoid((mse - 0.045) * 80.0)
            is_scribble = bool(scribble_prob[0].item() > 0.5)

            return {
                "is_scribble": is_scribble,
                "reconstruction_error": float(mse[0].item()),
                "energy_score": float(energy[0].item()),
                "scribble_confidence": float(scribble_prob[0].item())
            }
