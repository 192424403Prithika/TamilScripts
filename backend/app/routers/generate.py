"""
Generation Router: Character Generation, Text-to-Handwriting Synthesis and Style Encoding.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas.generate import (
    CharacterGenerationRequest, CharacterGenerationResponse,
    TextSynthesisRequest, TextSynthesisResponse
)
from ..services.generation_service import generation_service
from ..services.synthesis_service import synthesis_service

router = APIRouter(prefix="/api", tags=["Generation"])

@router.get("/generate/status")
def get_generation_status():
    return {
        "character_generator_ready": generation_service.is_ready(),
        "synthesis_ready": synthesis_service.is_ready()
    }

@router.post("/generate/character", response_model=CharacterGenerationResponse)
def generate_character(req: CharacterGenerationRequest):
    try:
        return generation_service.generate_character(req)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/generate/text", response_model=TextSynthesisResponse)
def generate_text(req: TextSynthesisRequest):
    try:
        return synthesis_service.synthesize_text(req)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

