from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os 

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "AI Rural Health Assistant"
    ENV: str = "development"
    API_V1_PREFIX: str = "/api"

    # MongoDB
    MONGO_URI: str = os.environ.get("MONGODB_URI")
    MONGO_DB_NAME: str = "rural_health"

    # JWT
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # SARVAM API KEY 
    SARVAM_API_KEY: str = os.environ.get("SARVAM_API_KEY")

    #SMTP SERVER EMAIL
    SMTP_SERVER_EMAIL: str = os.environ.get("SMTP_SERVER_EMAIL")
    SMTP_SERVER_PASSWORD: str = os.environ.get("SMTP_SERVER_PASSWORD")

    # CORS
    # Comma-separated list of allowed origins, e.g.
    #   CORS_ORIGINS=https://app.example.com,https://staff.example.com
    # Falls back to the local Vite dev server origins when unset.
    CORS_ORIGINS: list[str] = (
        [origin.strip() for origin in os.environ["CORS_ORIGINS"].split(",") if origin.strip()]
        if os.environ.get("CORS_ORIGINS")
        else [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    # fhir export 
    # core/config.py
    FHIR_BASE_URL: str = os.environ.get("FHIR_BASE_URL", "http://localhost:8000/api/fhir")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
