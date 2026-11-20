"""
Neural Character Generation Service.
Generates handwritten Tamil character images conditioned on class, style (slant, thickness), and random seed.
"""

import os
import sys
import json
import base64
import io
import time
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
from typing import Dict, Any, Optional

from ..schemas.generate import CharacterGenerationRequest, CharacterGenerationResponse, StyleVector

class GenerationService:
    def __init__(self):
        self.unicode_map = self._load_unicode_map()
        self.generator = None
        self._load_model()

    def _load_unicode_map(self):
        map_path = Path(__file__).resolve().parent.parent / "core" / "unicode_map.json"
        with open(map_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _load_model(self):
        try:
            import torch
            ckpt_path = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "checkpoints" / "generator_best.pt"
            if ckpt_path.exists():
                models_dir = ckpt_path.parent.parent / "models"
                if str(models_dir) not in sys.path:
                    sys.path.insert(0, str(models_dir))
                from generator import ConditionalGenerator
                gen = ConditionalGenerator(num_classes=len(self.unicode_map))
                gen.load_state_dict(torch.load(ckpt_path, map_location="cpu"))
                gen.eval()
                self.generator = gen
                print("[*] Loaded trained Character Generator model.")
            else:
                self.generator = None
        except Exception as e:
            print(f"[!] Warning: Character Generator not loaded: {e}")
            self.generator = None

    def is_ready(self) -> bool:
        return self.generator is not None

    def generate_character(self, req: CharacterGenerationRequest) -> CharacterGenerationResponse:
        t0 = time.perf_counter()
        if not self.is_ready():
            raise RuntimeError("Model not trained yet: Generator checkpoint is missing")

        import torch
        seed = req.seed if req.seed is not None else int(time.time() * 1000) % 100000
        torch.manual_seed(seed)
        np.random.seed(seed)

        cid = max(0, min(req.class_id, len(self.unicode_map) - 1))
        char_info = self.unicode_map[cid]
        char = char_info["char"]

        slant = req.style.slant if req.style else 0.0
        thickness = req.style.thickness if req.style else 0.0
        neatness = getattr(req.style, "neatness", 1.0) if req.style else 1.0

        with torch.no_grad():
            c_tensor = torch.tensor([cid], dtype=torch.long)
            style_tensor = torch.tensor([[slant, thickness, neatness]], dtype=torch.float32)
            z_tensor = torch.randn(1, 32)
            
            # Run real forward pass through trained generator
            gen_out = self.generator.generate(z_tensor, c_tensor, style_tensor)
            arr = gen_out.squeeze().numpy()
            arr = np.clip(arr, 0.0, 1.0)

        # Convert to PIL Image (white canvas, dark ink: 1.0 - arr)
        img_arr = ((1.0 - arr) * 255.0).astype(np.uint8)
        img = Image.fromarray(img_arr, mode="L")
        # Ensure 64x64
        if img.size != (64, 64):
            img = img.resize((64, 64), Image.Resampling.LANCZOS)

        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_b64 = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

        svg_data = f'<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><image href="{img_b64}" width="64" height="64" /></svg>'

        gen_time = round((time.perf_counter() - t0) * 1000.0, 2)
        return CharacterGenerationResponse(
            image_base64=img_b64,
            svg_data=svg_data,
            class_id=cid,
            char=char,
            seed=seed,
            generation_time_ms=gen_time
        )

generation_service = GenerationService()
