from pydantic import BaseModel
from typing import List, Optional, Dict

class TranslationRequest(BaseModel):
    tamil_text: str
    target_languages: List[str] = ["en", "hi"]

class TranslationResponse(BaseModel):
    tamil_text: str
    translations: Dict[str, str] # e.g. {"en": "Tamil script", "hi": "तमिल लिपि"}
    latency_ms: float

class TTSRequest(BaseModel):
    text: str
    rate: float = 1.0
    pitch: float = 1.0

class TTSResponse(BaseModel):
    text: str
    audio_base64: Optional[str] = None
    use_web_speech: bool = True
    lang: str = "ta-IN"

class SuggestionRequest(BaseModel):
    prefix_text: str # Already typed or recognized text
    top_k: int = 5

class SuggestionItem(BaseModel):
    char_or_word: str
    transliteration: str
    probability: float

class SuggestionResponse(BaseModel):
    prefix: str
    next_suggestions: List[SuggestionItem]
    autocorrect_alternatives: List[str]
