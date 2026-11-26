import json
import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator, model_validator
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
    DEFAULT_DEV_ADMIN_API_KEY: str = "campusway-admin-dev-secret"
    ADMIN_API_KEY: str = "campusway-admin-dev-secret"
    DEFAULT_DEV_JWT_SECRET: str = "campusway-default-jwt-secret-replace-in-production-min32chars"
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
    def is_database_configured(self) -> bool:
        if not self.DATABASE_URL or not self.DATABASE_URL.strip():
            return False
        raw = self.DATABASE_URL.strip().lower()
        if raw.startswith("sqlite") or raw == ":memory:":
            return False
        return raw.startswith("postgresql") or raw.startswith("postgres")

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

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.is_production:
            secret = (self.SESSION_SECRET or "").strip()
            if not secret:
                raise ValueError("SESSION_SECRET must not be empty in production.")
            if secret == self.DEFAULT_DEV_SESSION_SECRET:
                raise ValueError("Default development SESSION_SECRET is not permitted in production.")
            if len(secret) < 32:
                raise ValueError("SESSION_SECRET is too short (minimum 32 characters required in production).")
        return self

    def validate_production_startup(self) -> None:
        """Validate all required secrets and database configuration for production execution.
        
        Production startup must fail safely when required secrets are missing or using
        development fallback placeholders.
        """
        if not self.is_production:
            return

        # 1. Validate SESSION_SECRET
        secret = (self.SESSION_SECRET or "").strip()
        if not secret or secret == self.DEFAULT_DEV_SESSION_SECRET or len(secret) < 32:
            raise ValueError("Production startup failed: SESSION_SECRET must be at least 32 characters and non-default.")

        # 2. Validate ADMIN_API_KEY
        admin_key = (self.ADMIN_API_KEY or "").strip()
        if not admin_key or admin_key in (
            self.DEFAULT_DEV_ADMIN_API_KEY,
            "replace-with-a-local-admin-key",
            "replace-with-a-secure-admin-key",
        ) or len(admin_key) < 16:
            raise ValueError("Production startup failed: ADMIN_API_KEY must be at least 16 characters and non-default.")

        # 3. Validate JWT_SECRET_KEY
        jwt_key = (self.JWT_SECRET_KEY or "").strip()
        if not jwt_key or jwt_key in (
            self.DEFAULT_DEV_JWT_SECRET,
            "replace-with-a-random-secret-of-at-least-32-characters",
            "campusway-jwt-secret-key-change-in-production",
        ) or len(jwt_key) < 32:
            raise ValueError("Production startup failed: JWT_SECRET_KEY must be at least 32 characters and non-default.")

        # 4. Validate DATABASE_URL
        db_url = (self.DATABASE_URL or "").strip()
        if not db_url:
            raise ValueError("Production startup failed: DATABASE_URL must not be empty in production.")
        if db_url.startswith("sqlite") or db_url == ":memory:":
            raise ValueError("Production startup failed: SQLite is not permitted as a production database.")
        if not (
            db_url.startswith("postgresql://")
            or db_url.startswith("postgresql+psycopg2://")
            or db_url.startswith("postgres://")
        ):
            raise ValueError("Production startup failed: DATABASE_URL must be a valid PostgreSQL connection string.")

    model_config = SettingsConfigDict(
        env_file=(_ROOT_DIR / ".env", _BACKEND_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
