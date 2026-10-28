"""
Neural Character Language Model for Tamil Handwriting Auto-Correct and Next-Character Prediction.
Uses a character-level LSTM/Transformer to model Tamil transition probabilities.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Tuple

class TamilCharLM(nn.Module):
    """
    Predicts next Tamil character distribution given previous context characters.
    Also computes perplexity / character negative log likelihood to rescore OCR paths.
    """
    def __init__(self, vocab_size: int = 158, emb_dim: int = 64, hidden_dim: int = 128, num_layers: int = 2):
        super().__init__()
        # 0: <PAD>, 1: <BOS>, 2: <EOS>, 3..158: Tamil characters
        self.embedding = nn.Embedding(vocab_size, emb_dim, padding_idx=0)
        self.lstm = nn.LSTM(emb_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x: torch.Tensor, hidden=None) -> Tuple[torch.Tensor, Tuple]:
        # x: (B, Seq_Len)
        emb = self.embedding(x)
        out, hidden = self.lstm(emb, hidden)
        logits = self.fc(out)
        return logits, hidden

    def predict_next(self, prefix_indices: List[int], top_k: int = 5) -> List[Tuple[int, float]]:
        self.eval()
        with torch.no_grad():
            x = torch.tensor([[1] + prefix_indices], dtype=torch.long)
            logits, _ = self.forward(x)
            last_logits = logits[0, -1]
            probs = F.softmax(last_logits, dim=-1)
            top_probs, top_idx = torch.topk(probs, k=top_k)
            return [(int(top_idx[i]), float(top_probs[i])) for i in range(top_k)]
