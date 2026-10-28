"""
Coach Router: Handwriting Quality Scoring and Grad-CAM Explainability.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas.score import QualityScoreRequest, QualityScoreResponse
from ..schemas.explain import ExplainRequest, ExplainResponse
from ..services.scoring_service import scoring_service
from ..services.explain_service import explain_service
from ..db.session import get_db
from ..db.models import PracticeSession

router = APIRouter(prefix="/api", tags=["Coach & Explainability"])

@router.post("/score", response_model=QualityScoreResponse)
def score_handwriting(req: QualityScoreRequest, db: Session = Depends(get_db)):
    try:
        res = scoring_service.score_drawing(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Save practice session
    session_record = PracticeSession(
        target_char=res.target_char,
        quality_score=res.overall_score,
        proportions_score=res.proportions_score,
        loops_score=res.loops_score,
        smoothness_score=res.smoothness_score,
        feedback_text=res.feedback_text
    )
    db.add(session_record)
    db.commit()
    return res

@router.post("/explain", response_model=ExplainResponse)
def explain_prediction(req: ExplainRequest):
    return explain_service.explain_drawing(req)
