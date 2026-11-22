"""
Handwriting Quality Coaching Service.
Evaluates user's drawn glyph against class prototype templates using a trained Siamese CNN network.
Outputs verified neural similarity, consistent sub-scores, and diagnostic feedback.
"""

import os
import sys
import json
import base64
import io
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Tuple, Optional, Dict
from ..schemas.score import QualityScoreRequest, QualityScoreResponse

class ScoringService:
    def __init__(self):
        self.unicode_map = self._load_unicode_map()
        self.model = None
        self.recognizer = None
        self.prototypes = None
        self._load_models()

    def _load_unicode_map(self):
        map_path = Path(__file__).resolve().parent.parent / "core" / "unicode_map.json"
        with open(map_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _load_models(self):
        try:
            import torch
            ml_dir = Path(__file__).resolve().parent.parent.parent.parent / "ml"
            models_dir = ml_dir / "models"
            if str(models_dir) not in sys.path:
                sys.path.insert(0, str(models_dir))

            # 1. Load Quality Scorer
            ckpt_path = ml_dir / "checkpoints" / "scorer_best.pt"
            proto_path = ml_dir / "checkpoints" / "prototype_bank.pt"

            if ckpt_path.exists() and proto_path.exists():
                from scorer import QualityScorerCNN
                m = QualityScorerCNN(emb_dim=128)
                m.load_state_dict(torch.load(ckpt_path, map_location="cpu"))
                m.eval()
                self.model = m
                self.prototypes = torch.load(proto_path, map_location="cpu")
                print("[*] ScoringService: Loaded trained Siamese Quality Scorer & Prototype Bank.")
            else:
                self.model = None
                self.prototypes = None

            # 2. Load Recognizer for confusion diagnosis
            rec_ckpt = ml_dir / "checkpoints" / "recognizer_best.pt"
            if rec_ckpt.exists():
                from recognizer import LightweightTamilRecognizer
                rec = LightweightTamilRecognizer(num_classes=len(self.unicode_map))
                rec.load_state_dict(torch.load(rec_ckpt, map_location="cpu"))
                rec.eval()
                self.recognizer = rec
                print("[*] ScoringService: Loaded Recognizer for diagnostic analysis.")
            else:
                self.recognizer = None

        except Exception as e:
            print(f"[!] Warning: ScoringService models not loaded: {e}")
            self.model = None
            self.prototypes = None

    def is_ready(self) -> bool:
        return self.model is not None and self.prototypes is not None

    def preprocess_image(self, b64_str: str) -> np.ndarray:
        from .recognition_service import recognition_service
        tensor = recognition_service.preprocess_image_base64(b64_str)
        return tensor[0, 0]

    def score_drawing(self, req: QualityScoreRequest) -> QualityScoreResponse:
        if not self.is_ready():
            raise RuntimeError("Model not trained yet: Quality Scorer checkpoint (scorer_best.pt) is missing")

        import torch
        cid = max(0, min(req.target_class_id, len(self.unicode_map) - 1))
        target_info = self.unicode_map[cid]
        char = target_info["char"]

        if not req.user_image_base64:
            raise ValueError("user_image_base64 is required for handwriting scoring")

        user_arr = self.preprocess_image(req.user_image_base64)
        user_tensor = torch.from_numpy(user_arr).unsqueeze(0).unsqueeze(0).float()
        target_proto = self.prototypes[cid].unsqueeze(0)

        with torch.no_grad():
            res = self.model(user_tensor, target_proto)
            overall = float(np.clip(res["overall"].item(), 10.0, 99.0))
            prop = float(np.clip(res["proportions"].item(), 15.0, 99.0))
            loops = float(np.clip(res["loops"].item(), 15.0, 99.0))
            smooth = float(np.clip(res["smoothness"].item(), 15.0, 99.0))

            # Recognizer confusion diagnosis
            pred_char = None
            if self.recognizer is not None:
                logits = self.recognizer(user_tensor)
                pred_cid = torch.argmax(logits, dim=1).item()
                if pred_cid != cid and pred_cid < len(self.unicode_map):
                    pred_char = self.unicode_map[pred_cid]["char"]

            feedback = self.model.generate_feedback(
                {"overall": overall, "proportions": prop, "loops": loops, "smoothness": smooth},
                target_char=char,
                pred_char=pred_char
            )

        return QualityScoreResponse(
            target_char=char,
            target_transliteration=target_info.get("transliteration", ""),
            overall_score=round(overall, 1),
            proportions_score=round(prop, 1),
            loops_score=round(loops, 1),
            smoothness_score=round(smooth, 1),
            feedback_text=feedback,
            pass_status=bool(overall >= 70.0),
            reference_image_base64=None
        )

scoring_service = ScoringService()
