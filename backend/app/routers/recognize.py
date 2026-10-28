"""
Recognition Router: Real-time Character & Line Inference and Live Streaming WebSocket.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import List
import json
import time

from ..schemas.recognize import (
    StrokeRecognitionRequest, ImageRecognitionRequest,
    LineRecognitionRequest, LineRecognitionResponse,
    RecognitionResponse, StrokePoint
)
from ..services.recognition_service import recognition_service
from ..db.session import get_db
from ..db.models import DrawingHistory

router = APIRouter(tags=["Recognition"])

@router.post("/api/recognize/character", response_model=RecognitionResponse)
def recognize_character(req: StrokeRecognitionRequest, db: Session = Depends(get_db)):
    res = recognition_service.predict_strokes(
        strokes=req.strokes,
        image_base64=req.image_base64,
        use_ensemble=req.use_ensemble,
        model_engine=req.model_engine
    )
    
    # Record history
    if res.top_prediction:
        history_entry = DrawingHistory(
            predicted_char=res.recognized_word if res.recognized_word else res.top_prediction.char,
            transliteration=res.top_prediction.transliteration,
            confidence=res.word_confidence if res.word_confidence else res.top_prediction.confidence,
            latency_ms=res.latency_ms,
            input_type="strokes_image"
        )
        db.add(history_entry)
        db.commit()
    return res

@router.post("/api/recognize/image", response_model=RecognitionResponse)
def recognize_image(req: ImageRecognitionRequest, db: Session = Depends(get_db)):
    res = recognition_service.predict_image(req.image_base64, model_engine=req.model_engine)
    if res.top_prediction:
        history_entry = DrawingHistory(
            predicted_char=res.recognized_word if res.recognized_word else res.top_prediction.char,
            transliteration=res.top_prediction.transliteration,
            confidence=res.word_confidence if res.word_confidence else res.top_prediction.confidence,
            latency_ms=res.latency_ms,
            input_type="image"
        )
        db.add(history_entry)
        db.commit()
    return res

@router.post("/api/recognize/line", response_model=LineRecognitionResponse)
def recognize_line(req: LineRecognitionRequest):
    return recognition_service.recognize_line_or_word(req.image_base64)

@router.websocket("/ws/recognize")
async def websocket_recognize(websocket: WebSocket):
    """
    Live streaming WebSocket connection.
    Client sends live pen points: [{"x": 0.2, "y": 0.4, "pen_down": 1, "dt": 0.02}, ...]
    Server replies immediately with top predictions and live latency in < 30 ms.
    """
    await websocket.accept()
    try:
        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            
            strokes = [StrokePoint(**pt) for pt in data.get("strokes", [])]
            if len(strokes) >= 3:
                res = recognition_service.predict_strokes(strokes)
                await websocket.send_json(res.model_dump())
            else:
                await websocket.send_json({
                    "predictions": [],
                    "top_prediction": None,
                    "latency_ms": 1.2,
                    "modality": "idle"
                })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS Exception: {e}")
