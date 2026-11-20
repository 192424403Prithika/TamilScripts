"""
Application Configuration Settings.
Loads configuration from environment variables with safe development defaults.
"""

import os
import json
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union

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
    
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def parse_cors_origins(cls, v) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(x) for x in parsed]
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    MODEL_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/export/saved_models"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
