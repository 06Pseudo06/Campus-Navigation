import json
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ROOT_DIR = _BACKEND_DIR.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusWay Route Intelligence Service"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/campusway_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_PRE_PING: bool = True

    # Security & Administration
    ADMIN_API_KEY: str = "campusway-admin-dev-secret"
    JWT_SECRET_KEY: str = "campusway-default-jwt-secret-replace-in-production-min32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Session & Cookie Security (Newer auth integration)
    DEFAULT_DEV_SESSION_SECRET: str = "campusway-dev-secret-key-must-be-changed-in-production-min-32-chars"
    SESSION_SECRET: str = "campusway-dev-secret-key-must-be-changed-in-production-min-32-chars"
    SESSION_COOKIE_NAME: str = "campusway_session"
    SESSION_DEFAULT_MAX_AGE_SECONDS: int = 60 * 60 * 24  # 1 day (24 hours)
    SESSION_REMEMBER_ME_MAX_AGE_SECONDS: int = 60 * 60 * 24 * 30  # 30 days
    SESSION_MAX_AGE_SECONDS: int = 60 * 60 * 24  # 1 day (backwards compatibility)
    STATE_COOKIE_NAME: str = "campusway_oauth_state"
    STATE_MAX_AGE_SECONDS: int = 60 * 15  # 15 minutes

    # Pedestrian Routing Parameters
    # Standard comfortable human walking speed: ~1.3 meters/second (~4.7 km/h)
    DEFAULT_WALKING_SPEED_MPS: float = 1.3

    # External Provider Configuration (Integration interfaces)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_SERVICE_SID: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_google_configured(self) -> bool:
        return bool(
            self.GOOGLE_CLIENT_ID
            and self.GOOGLE_CLIENT_SECRET
            and self.GOOGLE_CLIENT_ID.strip()
            and self.GOOGLE_CLIENT_SECRET.strip()
            and not self.GOOGLE_CLIENT_ID.startswith("your-google-client-id")
        )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=(_ROOT_DIR / ".env", _BACKEND_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
