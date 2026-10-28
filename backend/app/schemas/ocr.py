from pydantic import BaseModel
from typing import List, Optional

class TextLineBox(BaseModel):
    line_index: int
    bounding_box: List[int] # [ymin, xmin, ymax, xmax]
    line_text: str
    confidence: float

class PageOCRRequest(BaseModel):
    image_base64: str
    enhance_denoise: bool = True
    export_format: str = "json" # "json", "txt", "docx"

class PageOCRResponse(BaseModel):
    full_text: str
    line_count: int
    lines: List[TextLineBox]
    processing_time_ms: float
    enhanced_image_base64: Optional[str] = None
