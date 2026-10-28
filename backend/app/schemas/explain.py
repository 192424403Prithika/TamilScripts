from pydantic import BaseModel
from typing import List, Optional

class ExplainRequest(BaseModel):
    image_base64: str
    target_class_id: Optional[int] = None

class ExplainResponse(BaseModel):
    predicted_char: str
    confidence: float
    gradcam_heatmap_base64: str
    gradcam_grid: List[List[float]] # 64x64 float values
    is_scribble: bool
    reconstruction_error: float
    energy_score: float
    explanation_summary: str
