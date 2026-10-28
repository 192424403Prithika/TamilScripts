"""
Backend API and Sanity Tests.
Tests authentication, recognition, generation, coach, and health endpoints.
"""

import pytest
from fastapi.testclient import TestClient
import numpy as np
import base64
import io
from PIL import Image

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) >= 7

def test_leaderboard_endpoint():
    response = client.get("/api/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

def test_recognize_character_endpoint():
    # Send dummy stroke trajectory
    payload = {
        "strokes": [
            {"x": 0.2, "y": 0.3, "pen_down": 1, "dt": 0.02},
            {"x": 0.4, "y": 0.3, "pen_down": 1, "dt": 0.02},
            {"x": 0.4, "y": 0.6, "pen_down": 1, "dt": 0.02},
            {"x": 0.2, "y": 0.6, "pen_down": 0, "dt": 0.02}
        ],
        "use_ensemble": True
    }
    response = client.post("/api/recognize/character", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 5
    assert data["latency_ms"] < 200.0 # Conforms to latency requirement

def test_character_generation_endpoint():
    payload = {
        "class_id": 0, # அ
        "style": {"slant": 0.1, "thickness": 0.2},
        "seed": 42
    }
    response = client.post("/api/generate/character", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "image_base64" in data
    assert data["char"] == "அ"

def test_text_synthesis_endpoint():
    payload = {
        "text": "தமிழ்",
        "neatness": 1.2,
        "speed": 1.0,
        "ink_color": "#ea580c"
    }
    response = client.post("/api/generate/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "svg_markup" in data
    assert len(data["strokes"]) == len(payload["text"])

def test_scoring_coach_endpoint():
    import base64
    from io import BytesIO
    from PIL import Image

    # Should reject when user_image_base64 is missing
    bad_payload = {"target_class_id": 0}
    bad_res = client.post("/api/score", json=bad_payload)
    assert bad_res.status_code == 400

    # Test with valid image
    img = Image.new("L", (64, 64), color=255)
    buf = BytesIO()
    img.save(buf, format="PNG")
    b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

    payload = {
        "target_class_id": 0,
        "user_image_base64": b64
    }
    response = client.post("/api/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "feedback_text" in data

def test_nlp_translate_endpoint():
    payload = {
        "tamil_text": "வணக்கம்"
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "en" in data["translations"]
