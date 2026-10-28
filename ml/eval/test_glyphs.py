import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from app.services.recognition_service import recognition_service, split_tamil_graphemes

font = ImageFont.truetype(r"C:\Windows\Fonts\Nirmala.ttc", 56)

for word in ['கல்வி', 'அம்மா', 'தமிழ்']:
    print(f"=== Testing Word: {word} ===")
    graphemes = split_tamil_graphemes(word)
    predicted_glyphs = []
    
    for g in graphemes:
        img = Image.new("L", (120, 120), color=0)
        draw = ImageDraw.Draw(img)
        bbox = draw.textbbox((0, 0), g, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text(((120 - tw)//2, (120 - th)//2), g, fill=255, font=font)
        
        tensor = recognition_service.preprocess_glyph_to_tensor(img)
        top5 = recognition_service.infer_single_glyph(tensor, k=5)
        top_items = []
        for cid, prob in top5:
            ch = recognition_service.unicode_map[cid]["char"]
            top_items.append(f"{ch} ({prob:.3f})")
        
        best_char = recognition_service.unicode_map[top5[0][0]]["char"]
        predicted_glyphs.append(best_char)
        print(f"  Target: '{g}' | Top-1: '{best_char}' | Top-5: {', '.join(top_items)}")
    
    recon_word = "".join(predicted_glyphs)
    print(f"--> Reconstructed Word: '{recon_word}' (Target: '{word}')\n")
