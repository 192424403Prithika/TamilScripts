"""
Gate 4 Model Integration Unit Tests:
- Output tensor shapes for Generator, Recognizer, Scorer
- Determinism for fixed seeds
- Recognizer agreement on generated outputs (>= 85%)
- Mathematical consistency of Scorer overall and auxiliary sub-scores
- Synthesis tokenization and stroke trajectory validity
"""

import sys
import os
from pathlib import Path
import pytest
import torch
import numpy as np

# Ensure model and backend directories are in path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "ml" / "models"))
sys.path.insert(0, str(ROOT / "ml" / "train"))
sys.path.insert(0, str(ROOT / "backend"))

from generator import ConditionalGenerator
from recognizer import LightweightTamilRecognizer
from scorer import QualityScorerCNN
from app.services.synthesis_service import synthesis_service

@pytest.fixture(scope="module")
def loaded_models():
    gen = ConditionalGenerator(num_classes=156)
    gen.load_state_dict(torch.load(ROOT / "ml" / "checkpoints" / "generator_best.pt", map_location="cpu"))
    gen.eval()

    rec = LightweightTamilRecognizer(num_classes=156)
    rec.load_state_dict(torch.load(ROOT / "ml" / "checkpoints" / "recognizer_best.pt", map_location="cpu"))
    rec.eval()

    scorer = QualityScorerCNN()
    scorer.load_state_dict(torch.load(ROOT / "ml" / "checkpoints" / "scorer_best.pt", map_location="cpu"))
    scorer.eval()

    return {
        "generator": gen,
        "recognizer": rec,
        "scorer": scorer
    }

def test_model_output_shapes(loaded_models):
    gen = loaded_models["generator"]
    rec = loaded_models["recognizer"]
    scorer = loaded_models["scorer"]

    with torch.no_grad():
        c = torch.tensor([0], dtype=torch.long)
        z = torch.randn(1, 32)
        s = torch.zeros(1, 3)
        img = gen(z, c, s)
        assert img.shape == (1, 1, 64, 64), f"Unexpected generator shape: {img.shape}"

        logits = rec(img)
        assert logits.shape == (1, 156), f"Unexpected recognizer shape: {logits.shape}"

        emb = scorer.encode(img)
        assert emb.shape == (1, 128), f"Unexpected scorer embedding shape: {emb.shape}"

        scores = scorer(img, emb)
        assert "overall" in scores
        assert "proportions" in scores
        assert "loops" in scores
        assert "smoothness" in scores

def test_generator_determinism(loaded_models):
    gen = loaded_models["generator"]

    with torch.no_grad():
        torch.manual_seed(999)
        z1 = torch.randn(1, 32)
        c = torch.tensor([42], dtype=torch.long)
        s = torch.tensor([[0.1, -0.2, 0.4]])
        out1 = gen(z1, c, s)

        torch.manual_seed(999)
        z2 = torch.randn(1, 32)
        out2 = gen(z2, c, s)

        assert torch.equal(out1, out2), "Generator output is non-deterministic for identical seed!"

def test_recognizer_agreement_on_generated_output(loaded_models):
    gen = loaded_models["generator"]
    rec = loaded_models["recognizer"]

    test_classes = [0, 1, 2, 4, 13, 14, 31, 33, 37, 39, 40, 45]
    correct = 0

    with torch.no_grad():
        for cid in test_classes:
            torch.manual_seed(cid * 100 + 42)
            c = torch.tensor([cid], dtype=torch.long)
            z = torch.randn(1, 32)
            s = torch.zeros(1, 3)
            gen_img = gen(z, c, s)
            pred = rec(gen_img).argmax(dim=-1).item()
            if pred == cid:
                correct += 1

    agreement = correct / len(test_classes)
    assert agreement >= 0.85, f"Recognizer agreement ({agreement*100:.1f}%) is below 85% requirement!"

def test_scorer_subscores_consistency(loaded_models):
    scorer = loaded_models["scorer"]

    with torch.no_grad():
        dummy_img = torch.rand(1, 1, 64, 64)
        emb = scorer.encode(dummy_img)
        result = scorer(dummy_img, emb)

        sim = float(result["similarity"])
        prop = float(result["proportions"])
        loops = float(result["loops"])
        smooth = float(result["smoothness"])
        overall = float(result["overall"])

        # Check mathematical consistency formula
        expected_overall = 0.55 * sim + 0.15 * prop + 0.15 * loops + 0.15 * smooth
        assert abs(overall - expected_overall) < 1e-3, "Overall score must strictly be derived from its components!"
        assert 0.0 <= overall <= 100.0, "Score must be bounded in [0, 100]"

def test_synthesis_service_tokenization_and_generation():
    assert synthesis_service.is_ready(), "Synthesis service must be loaded and ready"

    word = "தமிழ் வாழ்க"
    tokens = synthesis_service.tokenize_text(word)
    assert len(tokens) > 0

    from app.schemas.generate import TextSynthesisRequest
    req = TextSynthesisRequest(
        text=word,
        speed=1.0,
        neatness=1.0,
        slant=0.0
    )
    res = synthesis_service.synthesize_text(req)
    assert res.svg_markup is not None
    assert "<svg" in res.svg_markup
    assert len(res.strokes) > 0
