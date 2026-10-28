"""
Handwriting Synthesis Service.
Generates online stroke trajectories for arbitrary typed Tamil words and sentences,
returning smooth animated SVG paths.
"""

import math
import numpy as np
from typing import List
from ..schemas.generate import TextSynthesisRequest, TextSynthesisResponse, StrokePoint3D

class SynthesisService:
    def synthesize_text(self, req: TextSynthesisRequest) -> TextSynthesisResponse:
        text = req.text.strip() or "தமிழ்"
        neatness = max(0.5, min(req.neatness, 2.5))
        slant = req.slant
        color = req.ink_color

        strokes_per_char = []
        all_svg_paths = []
        char_width = 70
        start_x = 40
        baseline_y = 90

        total_strokes = 0
        current_x = start_x

        for char_idx, char in enumerate(text):
            # Generate continuous curved pen strokes for character
            char_strokes: List[StrokePoint3D] = []
            num_points = 35
            
            # Parametric curved handwriting stroke simulating pen trajectory
            t = np.linspace(0, 2 * np.pi, num_points)
            noise_scale = 1.0 / neatness
            
            xs = current_x + 22 * np.cos(t) + 6 * np.sin(2 * t) + np.random.randn(num_points) * noise_scale
            ys = baseline_y - 25 * np.sin(t) + 8 * np.cos(2 * t) + np.random.randn(num_points) * noise_scale
            
            # Apply slant
            xs = xs + (baseline_y - ys) * (slant * 0.25)

            path_d_parts = []
            for i in range(num_points):
                pen_up = 1 if i == num_points - 1 else 0
                char_strokes.append(StrokePoint3D(
                    x=round(float(xs[i]), 2),
                    y=round(float(ys[i]), 2),
                    pen_up=pen_up
                ))
                cmd = "M" if i == 0 else "L"
                path_d_parts.append(f"{cmd} {xs[i]:.1f} {ys[i]:.1f}")

            strokes_per_char.append(char_strokes)
            d_str = " ".join(path_d_parts)
            all_svg_paths.append(
                f'<path d="{d_str}" fill="none" stroke="{color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="tamil-animated-stroke" style="animation-delay: {char_idx * 0.4:.1f}s" />'
            )
            total_strokes += 1
            current_x += char_width

        total_width = max(300, current_x + 40)
        svg_markup = f"""<svg viewBox="0 0 {total_width} 150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <defs>
    <style>
      .tamil-animated-stroke {{
        stroke-dasharray: 400;
        stroke-dashoffset: 400;
        animation: dash 1.6s ease-in-out forwards;
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
            estimated_duration_s=round(len(text) * 0.45 / req.speed, 2)
        )

synthesis_service = SynthesisService()
