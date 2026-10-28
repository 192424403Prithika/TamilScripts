from pydantic import BaseModel
from typing import List, Optional

class StyleVector(BaseModel):
    slant: float = 0.0 # -1.0 to 1.0
    thickness: float = 0.0 # -1.0 to 1.0
    curvature: float = 0.0 # -1.0 to 1.0
    pressure: float = 0.0 # -1.0 to 1.0

class CharacterGenerationRequest(BaseModel):
    class_id: int
    style: Optional[StyleVector] = None
    seed: Optional[int] = None
    custom_style_embedding: Optional[List[float]] = None

class CharacterGenerationResponse(BaseModel):
    image_base64: str
    svg_data: Optional[str] = None
    class_id: int
    char: str
    seed: int
    generation_time_ms: float

class TextSynthesisRequest(BaseModel):
    text: str # Tamil words or sentences
    speed: float = 1.0
    neatness: float = 1.2 # Graves-style sampling bias
    slant: float = 0.0
    ink_color: str = "#f97316"
    custom_style_embedding: Optional[List[float]] = None

class StrokePoint3D(BaseModel):
    x: float
    y: float
    pen_up: int

class TextSynthesisResponse(BaseModel):
    text: str
    strokes: List[List[StrokePoint3D]] # list of continuous strokes
    svg_markup: str
    stroke_count: int
    estimated_duration_s: float
