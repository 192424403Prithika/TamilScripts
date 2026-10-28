"""
TamilScript AI: Core FastAPI Application Entrypoint.
Production-ready REST and WebSocket server with deep learning real-time recognition fallback.
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .db.session import engine, Base
from .db import models
from .routers import auth, recognize, generate, coach, ocr, nlp, dashboard

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print(f"[*] {settings.APP_NAME} v{settings.APP_VERSION} Started")
    print(f"[*] Real-time Recognition Server active on {settings.HOST}:{settings.PORT}")
    print("=" * 60)
    yield
    print(f"[*] {settings.APP_NAME} shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade real-time handwritten Tamil character recognition and generation powered by deep learning.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(recognize.router)
app.include_router(generate.router)
app.include_router(coach.router)
app.include_router(ocr.router)
app.include_router(nlp.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "real_time_latency_guarantee": "<100ms"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
