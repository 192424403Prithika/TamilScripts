"""
NLP Router: Translation, Neural TTS voice metadata and next-character suggestions.
"""

from fastapi import APIRouter
from ..schemas.nlp import (
    TranslationRequest, TranslationResponse,
    TTSRequest, TTSResponse,
    SuggestionRequest, SuggestionResponse
)
from ..services.nlp_service import nlp_service

router = APIRouter(prefix="/api", tags=["NLP"])

@router.post("/translate", response_model=TranslationResponse)
def translate_tamil(req: TranslationRequest):
    return nlp_service.translate_text(req)

@router.post("/tts", response_model=TTSResponse)
def text_to_speech(req: TTSRequest):
    return TTSResponse(
        text=req.text,
        use_web_speech=True,
        lang="ta-IN"
    )

@router.post("/suggest", response_model=SuggestionResponse)
def suggest_next_tokens(req: SuggestionRequest):
    return nlp_service.suggest_next(req)
