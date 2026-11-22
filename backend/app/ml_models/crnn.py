"""
Model 6: CRNN (CNN + BiLSTM + CTC) for Handwritten Tamil Words and Text Lines.
Converts text line images (H=32, W=variable) into sequences of character tokens.
Includes:
- Feature extraction backbone (VGG/ResNet-lite)
- Recurrent sequence model (Bidirectional LSTM)
- CTC Decoder with greedy and beam search
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Tuple

class TamilCRNN(nn.Module):
    """
    CRNN architecture:
    Input: (B, 1, 32, W)
    Output: CTC logits (T, B, num_classes + 1) where index 0 is CTC blank token.
    """
    def __init__(self, num_classes: int = 157, hidden_size: int = 256):
        super().__init__()
        # CNN Feature Map Extractor
        # 32 -> 16 -> 8 -> 4 -> 1 height reduction
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, padding=1),
            nn.ReLU(True),
            nn.MaxPool2d(2, 2),  # (16, W/2)

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(True),
            nn.MaxPool2d(2, 2),  # (8, W/4)

            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(True),

            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.ReLU(True),
            nn.MaxPool2d((2, 1), (2, 1)),  # (4, W/4)

            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(True),
            nn.MaxPool2d((2, 1), (2, 1)),  # (2, W/4)

            nn.Conv2d(512, 512, kernel_size=2, padding=0),  # (1, W/4 - 1)
            nn.BatchNorm2d(512),
            nn.ReLU(True)
        )

        # Map to Sequence
        self.rnn = nn.Sequential(
            nn.LSTM(512, hidden_size, bidirectional=True, batch_first=True),
        )
        self.rnn2 = nn.Sequential(
            nn.LSTM(hidden_size * 2, hidden_size, bidirectional=True, batch_first=True)
        )

        # CTC output projection
        self.fc = nn.Linear(hidden_size * 2, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, 1, 32, W)
        features = self.cnn(x)
        b, c, h, w = features.shape
        assert h == 1, f"Height after CNN must be 1, got {h}"
        
        # Squeeze height dimension: (B, C, W) -> permute to (B, W, C)
        seq = features.squeeze(2).permute(0, 2, 1)
        
        out1, _ = self.rnn[0](seq)
        out2, _ = self.rnn2[0](out1)
        
        logits = self.fc(out2)  # (B, T, num_classes)
        # CTC loss requires (T, B, num_classes)
        return logits.permute(1, 0, 2)

    def decode_greedy(self, logits: torch.Tensor) -> List[List[int]]:
        """
        Greedy CTC Decoding: collapse consecutive duplicates and remove blank token (0).
        """
        # logits: (T, B, num_classes)
        probs = F.softmax(logits, dim=-1)
        preds = torch.argmax(probs, dim=-1)  # (T, B)
        preds = preds.permute(1, 0).cpu().numpy()  # (B, T)

        batch_results = []
        for seq in preds:
            collapsed = []
            prev = -1
            for token in seq:
                if token != prev:
                    if token != 0:  # 0 is blank
                        collapsed.append(int(token))
                    prev = token
            batch_results.append(collapsed)
        return batch_results
