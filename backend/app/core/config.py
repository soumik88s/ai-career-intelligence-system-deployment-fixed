import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Career Intelligence System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/ai_career_db"
    )

    class Config:
        case_sensitive = True

settings = Settings()
