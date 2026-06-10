from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    app_name: str = "Peer Tutoring AI Service"
    debug: bool = False
    
    # GCP / Firebase
    firebase_service_account_json: str = ""
    firebase_project_id: str = "tutorly-4c9a8"
    
    # ML Models
    model_path: str = "models/model.joblib"
    
    # AI / External
    openai_api_key: str = ""
    
    # Observability
    sentry_dsn: str = ""
    
    # Security
    internal_secret: str = "change_me_in_prod"
    api_base_url: str = "http://localhost:4000"
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:4000"]

    model_config = {
        "env_file": "../../.env.local",
        "extra": "ignore"
    }

settings = Settings()
