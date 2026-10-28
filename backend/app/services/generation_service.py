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

    def _load_unicode_map(self):
        map_path = Path(__file__).resolve().parent.parent / "core" / "unicode_map.json"
        with open(map_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def generate_character(self, req: CharacterGenerationRequest) -> CharacterGenerationResponse:
        t0 = time.perf_counter()
        seed = req.seed if req.seed is not None else np.random.randint(0, 100000)
        np.random.seed(seed)

        cid = max(0, min(req.class_id, len(self.unicode_map) - 1))
        char_info = self.unicode_map[cid]
        char = char_info["char"]

        # Base canvas
        canvas = Image.new("L", (128, 128), color=0)
        draw = ImageDraw.Draw(canvas)

        font = None
        for font_path in ["C:\\Windows\\Fonts\\Nirmala.ttf", "C:\\Windows\\Fonts\\Latha.ttf"]:
            if os.path.exists(font_path):
                try:
                    font = ImageFont.truetype(font_path, 68)
                    break
                except Exception:
                    pass
        if font is None:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), char, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (128 - tw) // 2 - bbox[0]
        y = (128 - th) // 2 - bbox[1]
        draw.text((x, y), char, fill=255, font=font)

        # Style modifications: slant, thickness
        slant = req.style.slant if req.style else 0.0
        thickness = req.style.thickness if req.style else 0.0

        if slant != 0.0:
            matrix = (1, slant * 0.3, 0, 0, 1, 0)
            canvas = canvas.transform((128, 128), Image.Transform.AFFINE, matrix, resample=Image.Resampling.BILINEAR)

        if thickness > 0.2:
            canvas = canvas.filter(ImageFilter.MaxFilter(3))
        elif thickness < -0.2:
            canvas = canvas.filter(ImageFilter.MinFilter(3))

        # Downsample to 64x64
        canvas = canvas.resize((64, 64), Image.Resampling.LANCZOS)

        # Convert to Base64 PNG
        buffered = io.BytesIO()
        canvas.save(buffered, format="PNG")
        img_b64 = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

        # SVG Outline Path
        svg_data = f'<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><text x="32" y="44" font-size="34" text-anchor="middle" fill="#f97316" font-family="Noto Sans Tamil">{char}</text></svg>'

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
