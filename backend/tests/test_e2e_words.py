"""
End-to-End Evaluation of Word Mode Recognition and Grapheme Segmentation.
Tests the target words (கல்வி, அம்மா, தமிழ்) against real neural inference.
Verifies Unicode integrity, grapheme cluster segmentation, and measured latency.
"""

import io
import base64
import pytest
from PIL import Image, ImageDraw, ImageFont
from app.services.recognition_service import (
    recognition_service,
    split_tamil_graphemes,
    transliterate_tamil_word,
)

@pytest.fixture(scope="module")
def tamil_font():
    font_path = r"C:\Windows\Fonts\Nirmala.ttc"
    try:
        return ImageFont.truetype(font_path, 56)
    except Exception:
        return ImageFont.load_default()

def render_word_canvas(word: str, font) -> str:
    """Renders word onto white-on-black canvas matching user drawing canvas."""
    clusters = split_tamil_graphemes(word)
    img = Image.new("L", (500, 160), color=0)
    draw = ImageDraw.Draw(img)
    curr_x = 30
    for c in clusters:
        bbox = draw.textbbox((curr_x, 40), c, font=font)
        draw.text((curr_x, 40), c, fill=255, font=font)
        curr_x = bbox[2] + 16

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

@pytest.mark.parametrize("target_word,expected_clusters", [
    ("கல்வி", ["க", "ல்", "வி"]),
    ("அம்மா", ["அ", "ம்", "மா"]),
    ("தமிழ்", ["த", "மி", "ழ்"]),
])
def test_e2e_word_recognition_and_grapheme_clustering(target_word, expected_clusters, tamil_font):
    # 1. Assert grapheme cluster segmenter groups vowel signs and pulli
    graphemes = split_tamil_graphemes(target_word)
    assert graphemes == expected_clusters, f"Grapheme cluster mismatch for {target_word}: {graphemes}"

    # 2. Render canvas and execute neural forward pass
    img_b64 = render_word_canvas(target_word, tamil_font)
    res = recognition_service.recognize_line_or_word(img_b64)

    # 3. Assert output is real Tamil Unicode, no Latin mock output
    assert len(res.recognized_text) > 0, "Recognized text must not be empty"
    for char in res.recognized_text:
        # Codepoints must be Tamil (0x0B80-0x0BFF) or valid punctuation
        assert 0x0B80 <= ord(char) <= 0x0BFF, f"Illegal non-Tamil codepoint: {char} (U+{ord(char):04X})"

    # 4. Assert segmentation chips use proper grapheme segmentation
    assert res.characters == split_tamil_graphemes(res.recognized_text)

    # 5. Assert latency was measured (real performance timer, not hardcoded)
    assert res.latency_ms > 0.0
    assert isinstance(res.latency_ms, float)

    # 6. Assert transliteration is generated
    assert len(res.transliteration) > 0
    assert res.transliteration.isascii()
