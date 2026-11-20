"""
Dashboard, History, Leaderboard and Health Monitoring Router.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..db.session import get_db
from ..db.models import DrawingHistory, LeaderboardEntry, PracticeSession

router = APIRouter(prefix="/api", tags=["Dashboard & Metrics"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TamilScript AI API",
        "backend": "FastAPI + ONNX Runtime",
        "real_time_target_ms": "<100ms"
    }

@router.get("/history")
def get_drawing_history(limit: int = 20, db: Session = Depends(get_db)):
    records = db.query(DrawingHistory).order_by(DrawingHistory.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "predicted_char": r.predicted_char,
            "transliteration": r.transliteration,
            "confidence": r.confidence,
            "latency_ms": r.latency_ms,
            "input_type": r.input_type,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    # Default gamified users if empty
    entries = db.query(LeaderboardEntry).order_by(LeaderboardEntry.total_xp.desc()).limit(10).all()
    if not entries:
        default_board = [
            {"username": "செந்தமிழ்_கவி", "total_xp": 2450, "streak_days": 18, "rank": 1, "badge": "Script Master"},
            {"username": "பாரதி_தாசன்", "total_xp": 1920, "streak_days": 14, "rank": 2, "badge": "Master Scribe"},
            {"username": "இனியன்_99", "total_xp": 1430, "streak_days": 9, "rank": 3, "badge": "Calligrapher"},
            {"username": "அகரன்_தமிழ்", "total_xp": 980, "streak_days": 5, "rank": 4, "badge": "Stroke Scholar"},
            {"username": "மதிவாணன்", "total_xp": 650, "streak_days": 3, "rank": 5, "badge": "Script Novice"}
        ]
        return default_board

    return [
        {
            "username": e.username,
            "total_xp": e.total_xp,
            "streak_days": e.streak_days,
            "rank": e.rank,
            "badge": e.badge
        }
        for e in entries
    ]

@router.get("/metrics")
def get_model_metrics():
    """
    Returns live operational performance metrics from real training and evaluation runs.
    """
    import json
    from pathlib import Path
    
    rec_metrics_path = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "runs" / "recognizer_metrics.json"
    models = []
    
    if rec_metrics_path.exists():
        with open(rec_metrics_path, "r", encoding="utf-8") as f:
            rm = json.load(f)
        models.append({
            "name": "Lightweight Tamil Recognizer (SE-ResNet)",
            "target_platform": "Client-Side (TF.js WebGL/WASM) + Server Fallback",
            "test_top1_acc": round(rm.get("test_top1_accuracy", 0.0), 2),
            "test_top5_acc": round(rm.get("test_top5_accuracy", 0.0), 2),
            "user_test_top1_acc": round(rm.get("user_test_top1_accuracy", 0.0), 2),
            "params": rm.get("param_count", 90652),
            "status": "Trained & Exported"
        })
    else:
        models.append({
            "name": "Lightweight Tamil Recognizer (SE-ResNet)",
            "status": "Model not trained yet"
        })

    # Generator status
    ckpt_gen = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "checkpoints" / "generator_best.pt"
    models.append({
        "name": "Character Generator (Gate 1)",
        "status": "Trained & Active" if ckpt_gen.exists() else "Model not trained yet",
        "params": 1115968
    })

    # Synthesis status
    ckpt_synth = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "checkpoints" / "synth_best.pt"
    models.append({
        "name": "Handwriting Synthesis MDN (Gate 2)",
        "status": "Trained & Active" if ckpt_synth.exists() else "Model not trained yet",
        "params": 968825
    })

    # Scorer status
    ckpt_scorer = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "checkpoints" / "scorer_best.pt"
    models.append({
        "name": "Practice Coach Scorer (Gate 3)",
        "status": "Trained & Active" if ckpt_scorer.exists() else "Model not trained yet",
        "params": 1404484
    })

    return {
        "models": models,
        "summary": {
            "total_character_classes": 156,
            "runtime_environment": "PyTorch CPU + ONNX Runtime / TF.js"
        }
    }
