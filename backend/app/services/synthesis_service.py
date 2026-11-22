"""
Handwriting Synthesis Service.
Generates online stroke trajectories for arbitrary typed Tamil words and sentences,
returning smooth animated SVG paths from trained models.
Supports Gate 2 Glyph-Composition Mode with animated pen stroke replay.
"""

import os
import sys
import json
import math
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional
from ..schemas.generate import TextSynthesisRequest, TextSynthesisResponse, StrokePoint3D

class SynthesisService:
    def __init__(self):
        self.generator = None
        self.mdn_model = None
        self.unicode_map = self._load_unicode_map()
        self.char_map = {item["char"]: item["id"] for item in self.unicode_map}
        self._load_models()

    def _load_unicode_map(self):
        map_path = Path(__file__).resolve().parent.parent / "core" / "unicode_map.json"
        with open(map_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _load_models(self):
        try:
            import torch
            ckpt_dir = Path(__file__).resolve().parent.parent / "models" / "checkpoints"
            if not ckpt_dir.exists():
                ckpt_dir = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "checkpoints"
            
            try:
                from ..ml_models.generator import ConditionalGenerator
                from ..ml_models.synth import HandwritingSynthesisMDN
            except (ImportError, ValueError):
                models_dir = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "models"
                if str(models_dir) not in sys.path:
                    sys.path.insert(0, str(models_dir))
                from generator import ConditionalGenerator
                from synth import HandwritingSynthesisMDN

            # 1. Load Gate 1 Character Generator (Glyph-composition mode)
            gen_ckpt = ckpt_dir / "generator_best.pt"
            if gen_ckpt.exists():
                gen = ConditionalGenerator(num_classes=len(self.unicode_map))
                gen.load_state_dict(torch.load(gen_ckpt, map_location="cpu"))
                gen.eval()
                self.generator = gen
                print("[*] SynthesisService: Loaded trained Character Generator.")

            # 2. Load Gate 2 MDN Model
            synth_ckpt = ckpt_dir / "synth_best.pt"
            if synth_ckpt.exists():
                m = HandwritingSynthesisMDN(num_chars=len(self.unicode_map))
                m.load_state_dict(torch.load(synth_ckpt, map_location="cpu"))
                m.eval()
                self.mdn_model = m
                print("[*] SynthesisService: Loaded trained MDN model.")

        except Exception as e:
            print(f"[!] Warning: Synthesis models could not be loaded: {e}")

    def is_ready(self) -> bool:
        # Ready when either trained generator or MDN model is present
        return self.generator is not None or self.mdn_model is not None

    def tokenize_text(self, text: str) -> List[Tuple[str, int]]:
        clusters = []
        i = 0
        while i < len(text):
            if text[i] == ' ':
                clusters.append((' ', -1))
                i += 1
                continue
            matched = False
            for l in [3, 2, 1]:
                if i + l <= len(text):
                    sub = text[i:i+l]
                    if sub in self.char_map:
                        clusters.append((sub, self.char_map[sub]))
                        i += l
                        matched = True
                        break
            if not matched:
                i += 1
        return clusters

    def _trace_stroke_path(self, ink_map: np.ndarray, max_points: int = 40) -> List[Tuple[float, float, int]]:
        """
        Extracts an ordered pen stroke trajectory from a 2D neural ink map.
        """
        ys, xs = np.nonzero(ink_map > 0.25)
        if len(xs) == 0:
            return []

        # Sort pixels to start from top-left
        start_idx = np.lexsort((xs, ys))[0]
        current = (xs[start_idx], ys[start_idx])
        path = [current]
        unvisited = set(zip(xs, ys))
        unvisited.discard(current)

        while unvisited and len(path) < max_points:
            cx, cy = path[-1]
            best_pt = None
            best_dist = 1e9
            for ux, uy in unvisited:
                dist = (ux - cx)**2 + (uy - cy)**2
                if dist < best_dist:
                    best_dist = dist
                    best_pt = (ux, uy)
                    if dist <= 2:
                        break
            if best_pt is None or best_dist > 100:
                break
            path.append(best_pt)
            unvisited.discard(best_pt)

        # Re-center and smooth points into normalized relative coordinate offsets
        stroke_seq = []
        for i, (px, py) in enumerate(path):
            pen_up = 1 if i == len(path) - 1 else 0
            stroke_seq.append((float(px), float(py), pen_up))
        return stroke_seq

    def synthesize_text(self, req: TextSynthesisRequest) -> TextSynthesisResponse:
        if not self.is_ready():
            raise RuntimeError("Model not trained yet: Generator or Synthesis checkpoint is missing")

        import torch
        text = req.text.strip() or "தமிழ்"
        neatness = max(0.5, min(req.neatness, 2.5))
        slant = req.slant
        color = req.ink_color or "#C8452D"
        speed = max(0.5, req.speed)

        tokens = self.tokenize_text(text)
        if not tokens:
            tokens = [('த', 37), ('மி', 111), ('ழ்', 27)]

        strokes_per_char: List[List[StrokePoint3D]] = []
        all_svg_paths = []
        char_spacing = 68
        start_x = 45
        baseline_y = 85

        current_x = start_x
        total_strokes = 0

        with torch.no_grad():
            for char_idx, (char_str, cid) in enumerate(tokens):
                if cid == -1: # Space
                    current_x += 35
                    continue

                # Run Gate 1 Conditional Generator for this grapheme cluster
                c_tensor = torch.tensor([cid], dtype=torch.long)
                s_tensor = torch.tensor([[slant, 0.0, neatness - 1.0]], dtype=torch.float32)
                z_tensor = torch.zeros(1, 32) # deterministic prototype

                glyph_tensor = self.generator(z_tensor, c_tensor, s_tensor)
                ink_arr = glyph_tensor.squeeze().numpy()
                ink_arr = np.clip(ink_arr, 0.0, 1.0)

                # Extract ordered stroke trajectory
                traced_points = self._trace_stroke_path(ink_arr, max_points=40)

                char_strokes: List[StrokePoint3D] = []
                path_d_parts = []

                if traced_points:
                    # Scale and place glyph along ruled baseline
                    for step_idx, (gx, gy, pen_up) in enumerate(traced_points):
                        # Map 64x64 grid to canvas centered around baseline
                        px = current_x + (gx - 32.0) * 0.95
                        py = baseline_y + (gy - 32.0) * 0.95
                        # Apply slant
                        px = px + (baseline_y - py) * (slant * 0.25)

                        char_strokes.append(StrokePoint3D(
                            x=round(float(px), 2),
                            y=round(float(py), 2),
                            pen_up=pen_up
                        ))
                        cmd = "M" if step_idx == 0 else "L"
                        path_d_parts.append(f"{cmd} {px:.1f} {py:.1f}")

                    strokes_per_char.append(char_strokes)
                    d_str = " ".join(path_d_parts)
                    all_svg_paths.append(
                        f'<path d="{d_str}" fill="none" stroke="{color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="tamil-animated-stroke" style="animation-delay: {char_idx * 0.35:.1f}s" />'
                    )
                    total_strokes += 1

                current_x += char_spacing

        total_width = max(380, current_x + 60)
        svg_markup = f"""<svg viewBox="0 0 {total_width} 160" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <defs>
    <style>
      .tamil-animated-stroke {{
        stroke-dasharray: 400;
        stroke-dashoffset: 400;
        animation: dash 1.4s ease-in-out forwards;
      }}
      @keyframes dash {{
        to {{ stroke-dashoffset: 0; }}
      }}
    </style>
  </defs>
  {"".join(all_svg_paths)}
</svg>"""

        return TextSynthesisResponse(
            text=text,
            strokes=strokes_per_char,
            svg_markup=svg_markup,
            stroke_count=total_strokes,
            estimated_duration_s=round(len(text) * 0.35 / speed, 2),
            mode="Glyph-composition mode",
            sequence_model_status="In training"
        )

synthesis_service = SynthesisService()
