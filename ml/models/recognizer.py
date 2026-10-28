"""
Model 1: Handwritten Tamil Character Recognizer.
Contains:
1. LightweightTamilRecognizer: Residual Blocks + Squeeze-and-Excitation (SE) + Depthwise Separable Convolutions (<5MB, <30ms CPU latency).
2. BaselineCNN: Plain 3-layer CNN for benchmark comparison.
3. EfficientTamilNet: Inverted Residual / MobileNetV3-style backbone for high-accuracy server mode.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class SqueezeExcitation(nn.Module):
    def __init__(self, channels: int, reduction: int = 4):
        super().__init__()
        self.fc1 = nn.Linear(channels, channels // reduction, bias=False)
        self.fc2 = nn.Linear(channels // reduction, channels, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.shape
        w = F.adaptive_avg_pool2d(x, (1, 1)).view(b, c)
        w = F.relu(self.fc1(w), inplace=True)
        w = torch.sigmoid(self.fc2(w)).view(b, c, 1, 1)
        return x * w

class DepthwiseSeparableConv(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, stride: int = 1):
        super().__init__()
        self.depthwise = nn.Conv2d(in_ch, in_ch, kernel_size=3, stride=stride, padding=1, groups=in_ch, bias=False)
        self.pointwise = nn.Conv2d(in_ch, out_ch, kernel_size=1, bias=False)
        self.bn = nn.BatchNorm2d(out_ch)
        self.act = nn.SiLU(inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.depthwise(x)
        x = self.pointwise(x)
        x = self.bn(x)
        return self.act(x)

class ResSEBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.conv1 = DepthwiseSeparableConv(channels, channels)
        self.conv2 = DepthwiseSeparableConv(channels, channels)
        self.se = SqueezeExcitation(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = x
        out = self.conv1(x)
        out = self.conv2(out)
        out = self.se(out)
        return out + res

class LightweightTamilRecognizer(nn.Module):
    """
    Core real-time model tailored for WebGL/WASM in-browser execution.
    Input: (B, 1, 64, 64)
    Output: Logits for 156 Tamil character classes.
    """
    def __init__(self, num_classes: int = 156, temperature: float = 1.0):
        super().__init__()
        self.temperature = nn.Parameter(torch.ones(1) * temperature)

        # Initial stem
        self.stem = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, stride=2, padding=1, bias=False),  # 32x32
            nn.BatchNorm2d(32),
            nn.SiLU(inplace=True),
        )

        # Stage 1 (32 channels)
        self.stage1 = nn.Sequential(
            ResSEBlock(32),
            nn.MaxPool2d(2, 2)  # 16x16
        )

        # Stage 2 (64 channels)
        self.down2 = DepthwiseSeparableConv(32, 64)
        self.stage2 = nn.Sequential(
            ResSEBlock(64),
            nn.MaxPool2d(2, 2)  # 8x8
        )

        # Stage 3 (128 channels)
        self.down3 = DepthwiseSeparableConv(64, 128)
        self.stage3 = nn.Sequential(
            ResSEBlock(128),
            nn.AdaptiveAvgPool2d((1, 1))  # 1x1
        )

        # Classifier head
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.stem(x)
        x = self.stage1(x)
        x = self.down2(x)
        x = self.stage2(x)
        x = self.down3(x)
        x = self.stage3(x)
        logits = self.head(x)
        return logits / torch.clamp(self.temperature, min=0.1, max=5.0)

    def predict_topk(self, x: torch.Tensor, k: int = 5):
        logits = self.forward(x)
        probs = F.softmax(logits, dim=-1)
        topk_probs, topk_indices = torch.topk(probs, k=k, dim=-1)
        return topk_indices, topk_probs

class BaselineCNN(nn.Module):
    """Simple 3-layer CNN baseline."""
    def __init__(self, num_classes: int = 156):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((2, 2)),
            nn.Flatten(),
            nn.Linear(128 * 4, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

class EfficientTamilNet(nn.Module):
    """High-accuracy server mode model with wider inverted residual stages."""
    def __init__(self, num_classes: int = 156):
        super().__init__()
        self.stem = nn.Sequential(
            nn.Conv2d(1, 48, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(48),
            nn.SiLU()
        )
        self.block1 = ResSEBlock(48)
        self.down1 = DepthwiseSeparableConv(48, 96, stride=2)
        self.block2 = ResSEBlock(96)
        self.down2 = DepthwiseSeparableConv(96, 192, stride=2)
        self.block3 = ResSEBlock(192)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(192, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.stem(x)
        x = self.block1(x)
        x = self.down1(x)
        x = self.block2(x)
        x = self.down2(x)
        x = self.block3(x)
        x = self.pool(x)
        return self.fc(x)
