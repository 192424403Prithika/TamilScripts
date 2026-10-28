"""
OCR Router: Document and Handwritten Page Scanner.
"""

from fastapi import APIRouter
from ..schemas.ocr import PageOCRRequest, PageOCRResponse
from ..services.ocr_service import ocr_service

router = APIRouter(prefix="/api/ocr", tags=["Document OCR"])

@router.post("/page", response_model=PageOCRResponse)
def scan_page(req: PageOCRRequest):
    return ocr_service.process_page(req)
