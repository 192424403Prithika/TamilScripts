from pydantic import BaseModel
from typing import List, Optional

class StrokePoint(BaseModel):
    x: float
    y: float
    pen_down: int = 1
    dt: float = 0.025

class StrokeRecognitionRequest(BaseModel):
    strokes: List[StrokePoint]
    image_base64: Optional[str] = None
    client_timestamp: Optional[float] = None
    use_ensemble: bool = True
    model_engine: str = "auto" # "auto", "huggingface", or "onnx"

class ImageRecognitionRequest(BaseModel):
    image_base64: str # Base64 encoded PNG/JPEG
    client_timestamp: Optional[float] = None
    high_accuracy_mode: bool = False
    model_engine: str = "auto" # "auto", "huggingface", or "onnx"

class PredictionItem(BaseModel):
    class_id: int
    char: str
    transliteration: str
    confidence: float
    unicode: str
    category: str
    meaning: str
    stroke_count: int

class RecognitionResponse(BaseModel):
    predictions: List[PredictionItem] = []
    top_prediction: Optional[PredictionItem] = None
    recognized_word: Optional[str] = None
    word_transliteration: Optional[str] = None
    word_confidence: Optional[float] = None
    segmented_chars: Optional[List[str]] = None
    latency_ms: float
    modality: str # "strokes", "image", "word_ocr", or "fused_ensemble"
    is_scribble: bool = False
    ood_score: float = 0.0

class LineRecognitionRequest(BaseModel):
    image_base64: str

class LineRecognitionResponse(BaseModel):
    recognized_text: str
    transliteration: str
    characters: List[str]
    confidence: float
    latency_ms: float
    model_name: Optional[str] = "TamilCRNN (ONNX)"
    warning: Optional[str] = None
    alternatives: Optional[List[str]] = None
    is_low_confidence: Optional[bool] = False
