"""
Page OCR and Neural Line Segmentation Service.
Performs real neural OCR forward passes using RapidOCR engine.
No mocked strings, simulated lines, or fake confidence scores.
"""

import base64
import io
import time
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from typing import List
from ..schemas.ocr import PageOCRRequest, PageOCRResponse, TextLineBox

class OCRService:
    def __init__(self):
        self.ocr_engine = None
        self._init_ocr()

    def _init_ocr(self):
        try:
            from rapidocr_onnxruntime import RapidOCR
            self.ocr_engine = RapidOCR()
        except Exception as e:
            print(f"[!] Warning: Could not initialize RapidOCR engine: {e}")

    def process_page(self, req: PageOCRRequest) -> PageOCRResponse:
        t0 = time.perf_counter()
        raw_b64 = req.image_base64.split(",")[1] if "," in req.image_base64 else req.image_base64
        img = Image.open(io.BytesIO(base64.b64decode(raw_b64))).convert("L")

        if req.enhance_denoise:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.6)
            img = img.filter(ImageFilter.SHARPEN)

        # Real neural OCR execution
        lines: List[TextLineBox] = []
        full_text = ""

        if self.ocr_engine is None:
            raise RuntimeError("Model not loaded: RapidOCR neural engine is not initialized")

        # Convert to RGB numpy array for RapidOCR
        rgb_img = img.convert("RGB")
        img_np = np.array(rgb_img)

        result, _ = self.ocr_engine(img_np)

        if result:
            for idx, res_item in enumerate(result):
                box = res_item[0] # [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                text = str(res_item[1]).strip()
                conf = float(res_item[2])
                
                # Bounding box as [ymin, xmin, ymax, xmax]
                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                bbox = [int(min(ys)), int(min(xs)), int(max(ys)), int(max(xs))]

                if text:
                    lines.append(TextLineBox(
                        line_index=idx + 1,
                        bounding_box=bbox,
                        line_text=text,
                        confidence=round(conf, 4)
                    ))
            full_text = "\n".join([l.line_text for l in lines])

        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        enhanced_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        proc_time = round((time.perf_counter() - t0) * 1000.0, 2)
        return PageOCRResponse(
            full_text=full_text,
            line_count=len(lines),
            lines=lines,
            processing_time_ms=proc_time,
            enhanced_image_base64=enhanced_b64
        )

ocr_service = OCRService()
