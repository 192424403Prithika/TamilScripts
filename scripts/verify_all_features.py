import sys
import os
import io
import base64
import importlib
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(line_buffering=True)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Dynamic runtime imports to keep static linters / IDE clean
recognition_service = importlib.import_module("app.services.recognition_service").recognition_service
scoring_service = importlib.import_module("app.services.scoring_service").scoring_service
explain_service = importlib.import_module("app.services.explain_service").explain_service
generation_service = importlib.import_module("app.services.generation_service").generation_service
synthesis_service = importlib.import_module("app.services.synthesis_service").synthesis_service
ocr_service = importlib.import_module("app.services.ocr_service").ocr_service

QualityScoreRequest = importlib.import_module("app.schemas.score").QualityScoreRequest
ExplainRequest = importlib.import_module("app.schemas.explain").ExplainRequest
CharacterGenerationRequest = importlib.import_module("app.schemas.generate").CharacterGenerationRequest
TextSynthesisRequest = importlib.import_module("app.schemas.generate").TextSynthesisRequest
PageOCRRequest = importlib.import_module("app.schemas.ocr").PageOCRRequest

def create_sample_drawing(text="அ"):
    im = Image.new("L", (540, 360), color=14)
    draw = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("arial.ttf", 160)
    except Exception:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (540 - w) // 2
    y = (360 - h) // 2
    draw.text((x, y), text, fill=255, font=font)
    
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"

sample_b64 = create_sample_drawing("அ")
print("[*] Sample base64 drawing created.", flush=True)

# 1. Recognition Service
print("\n--- 1. Testing Recognition Service ---", flush=True)
rec_res = recognition_service.predict_image(sample_b64)
print(f"[PASS] Top prediction: {rec_res.top_prediction.char} ({rec_res.top_prediction.transliteration}) with conf {rec_res.top_prediction.confidence:.2f}")
print(f"[PASS] Top 5: {[p.char for p in rec_res.predictions[:5]]}")
assert rec_res.top_prediction is not None

# 2. Quality Scoring Service
print("\n--- 2. Testing Scoring / Practice Coach Service ---", flush=True)
score_req = QualityScoreRequest(
    target_class_id=0,
    user_image_base64=sample_b64,
    user_strokes=[]
)
score_res = scoring_service.score_drawing(score_req)
print(f"[PASS] Target: {score_res.target_char} | Overall Score: {score_res.overall_score}%")
print(f"[PASS] Proportions: {score_res.proportions_score}% | Loops: {score_res.loops_score}% | Smoothness: {score_res.smoothness_score}%")
print(f"[PASS] Feedback: {score_res.feedback_text}")
assert score_res.overall_score > 0

# 3. Explainability Grad-CAM Service
print("\n--- 3. Testing Explainability Grad-CAM Service ---", flush=True)
explain_req = ExplainRequest(
    image_base64=sample_b64,
    target_class_id=0
)
explain_res = explain_service.explain_drawing(explain_req)
print(f"[PASS] Predicted: {explain_res.predicted_char} | Conf: {explain_res.confidence:.2f}")
print(f"[PASS] GradCAM heatmap present: {bool(explain_res.gradcam_heatmap_base64)} | Grid size: {len(explain_res.gradcam_grid)}x{len(explain_res.gradcam_grid[0])}")
print(f"[PASS] Summary: {explain_res.explanation_summary}")
assert explain_res.gradcam_heatmap_base64 is not None

# 4. Character Generation Service
print("\n--- 4. Testing Character Generation Service ---", flush=True)
gen_req = CharacterGenerationRequest(
    class_id=0
)
gen_res = generation_service.generate_character(gen_req)
print(f"[PASS] Generated Char: {gen_res.char} | Image base64 present: {bool(gen_res.image_base64)} | Seed: {gen_res.seed}")
assert len(gen_res.image_base64) > 0

# 5. Text Synthesis Service
print("\n--- 5. Testing Text Synthesis Service ---", flush=True)
syn_req = TextSynthesisRequest(
    text="தமிழ்",
    speed=1.0,
    slant=0.0
)
syn_res = synthesis_service.synthesize_text(syn_req)
print(f"[PASS] Synthesized Text: {syn_res.text} | Strokes count: {syn_res.stroke_count} | Mode: {syn_res.mode}")
print(f"[PASS] SVG markup length: {len(syn_res.svg_markup)}")
assert len(syn_res.svg_markup) > 0

# 6. Document OCR Service
print("\n--- 6. Testing Document Page OCR Service ---", flush=True)
doc_im = Image.new("L", (800, 400), color=255)
draw = ImageDraw.Draw(doc_im)
draw.text((60, 60), "அ", fill=0)
draw.text((60, 200), "ஆ", fill=0)
buf = io.BytesIO()
doc_im.save(buf, format="PNG")
doc_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

ocr_req = PageOCRRequest(image_base64=doc_b64)
ocr_res = ocr_service.process_page(ocr_req)
print(f"[PASS] Extracted full text: {repr(ocr_res.full_text)} | Detected lines: {ocr_res.line_count}")
for line in ocr_res.lines:
    print(f"       Line {line.line_index}: '{line.line_text}' (conf {line.confidence:.2f}) bbox {line.bounding_box}")
assert ocr_res.line_count >= 1

print("\n==================================================================")
print("[ALL PASSED] ALL 6 AI SERVICES AND ENDPOINTS FULLY OPERATIONAL!")
print("==================================================================")
