from pydantic import BaseModel
from typing import Optional, List

class QualityScoreRequest(BaseModel):
    target_class_id: int
    user_image_base64: Optional[str] = None
    user_strokes: Optional[List[dict]] = None

class QualityScoreResponse(BaseModel):
    target_char: str
    target_transliteration: str
    overall_score: float # 0 - 100
    proportions_score: float # 0 - 100
    loops_score: float # 0 - 100
    smoothness_score: float # 0 - 100
    feedback_text: str
    pass_status: bool
    reference_image_base64: str
