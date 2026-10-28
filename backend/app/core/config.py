"""
Application Configuration Settings.
Loads configuration from environment variables with safe development defaults.
"""

import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "TamilScript AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    JWT_SECRET: str = "tamilscript_super_secure_jwt_secret_key_2026_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    DATABASE_URL: str = "sqlite:///./tamilscript.db"
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    MODEL_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/export/saved_models"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
