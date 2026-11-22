"""
Model 4: Handwriting Synthesis (Graves-style LSTM Mixture Density Network).
Generates online pen stroke trajectories [dx, dy, pen_down] conditioned on a sequence of Tamil characters.
Supports:
- Sampling bias (neatness control)
- Variable stroke speed and slant
- Interactive SVG path generation
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class HandwritingSynthesisMDN(nn.Module):
    """
    Graves-style RNN conditioned on text characters to generate continuous stroke deltas.
    Outputs parameters of a Bivariate Gaussian Mixture Model + Bernoulli pen-lift probability:
    - 20 Gaussian mixtures: [pi, mu_x, mu_y, sigma_x, sigma_y, rho] -> 6 * M
    - 1 pen state probability: p_end -> 1
    Total outputs per step = 6 * 20 + 1 = 121
    """
    def __init__(self, num_chars: int = 156, char_emb_dim: int = 64, hidden_dim: int = 256, num_mixtures: int = 20):
        super().__init__()
        self.num_mixtures = num_mixtures
        self.char_emb = nn.Embedding(num_chars, char_emb_dim)
        
        # Input at each step: prev stroke delta [dx, dy, pen_down] (dim=3) + current char context
        self.lstm1 = nn.LSTMCell(3 + char_emb_dim, hidden_dim)
        self.lstm2 = nn.LSTMCell(hidden_dim + 3 + char_emb_dim, hidden_dim)
        
        # Output projection for GMM
        self.fc_out = nn.Linear(hidden_dim, num_mixtures * 6 + 1)

    def forward_step(self, stroke_in: torch.Tensor, char_ctx: torch.Tensor, h1, c1, h2, c2):
        x1 = torch.cat([stroke_in, char_ctx], dim=-1)
        h1, c1 = self.lstm1(x1, (h1, c1))
        
        x2 = torch.cat([h1, stroke_in, char_ctx], dim=-1)
        h2, c2 = self.lstm2(x2, (h2, c2))
        
        params = self.fc_out(h2)
        return params, h1, c1, h2, c2

    def sample_stroke(self, params: torch.Tensor, bias: float = 1.0):
        """
        Samples (dx, dy, pen_up) from GMM with temperature/bias control.
        bias > 1.0 yields tighter, neater handwriting.
        """
        M = self.num_mixtures
        eos = torch.sigmoid(params[:, 0])
        
        pi = F.softmax(params[:, 1:M+1] * bias, dim=-1)
        mu_x = params[:, M+1:2*M+1]
        mu_y = params[:, 2*M+1:3*M+1]
        sigma_x = torch.exp(params[:, 3*M+1:4*M+1] - (bias - 1.0))
        sigma_y = torch.exp(params[:, 4*M+1:5*M+1] - (bias - 1.0))
        rho = torch.tanh(params[:, 5*M+1:6*M+1])
        
        # Pick dominant mixture
        idx = torch.multinomial(pi, 1).item()
        
        mx = mu_x[0, idx].item()
        my = mu_y[0, idx].item()
        sx = max(0.01, sigma_x[0, idx].item())
        sy = max(0.01, sigma_y[0, idx].item())
        r = rho[0, idx].item()
        
        # Bivariate standard normal sample
        z1 = torch.randn(1).item()
        z2 = torch.randn(1).item()
        dx = mx + sx * z1
        dy = my + sy * (r * z1 + math.sqrt(max(1e-6, 1.0 - r * r)) * z2)
        pen_up = 1 if eos[0].item() > 0.5 else 0
        
        return dx, dy, pen_up
