from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve the .env path relative to this file (backend/.env),
# so it works regardless of the working directory uvicorn is launched from.
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """
    CampusWay Backend Configuration Settings.
    Loaded from environment variables or .env file.
    """
    # Application & Environment
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = ""

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # Session & Security
    DEFAULT_DEV_SESSION_SECRET: str = "campusway-dev-secret-key-must-be-changed-in-production-min-32-chars"
    SESSION_SECRET: str = "campusway-dev-secret-key-must-be-changed-in-production-min-32-chars"
    SESSION_COOKIE_NAME: str = "campusway_session"
    SESSION_DEFAULT_MAX_AGE_SECONDS: int = 60 * 60 * 24  # 1 day (24 hours)
    SESSION_REMEMBER_ME_MAX_AGE_SECONDS: int = 60 * 60 * 24 * 30  # 30 days
    SESSION_MAX_AGE_SECONDS: int = 60 * 60 * 24  # 1 day (backwards compatibility)
    STATE_COOKIE_NAME: str = "campusway_oauth_state"
    STATE_MAX_AGE_SECONDS: int = 60 * 15  # 15 minutes

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """
        Enforce strict security validation in production environment:
        - Rejects default development session secrets.
        - Enforces minimum length (32 characters).
        - Rejects empty secrets.
        - Never prints or exposes the secret string.
        """
        if self.is_production:
            secret = (self.SESSION_SECRET or "").strip()
            if not secret:
                raise ValueError(
                    "Production configuration error: SESSION_SECRET must not be empty. "
                    "Set a secure random string (minimum 32 characters) in production environment variables."
                )
            if (
                secret == self.DEFAULT_DEV_SESSION_SECRET
                or secret.startswith("campusway-dev-secret")
                or "must-be-changed" in secret
                or "change-in-production" in secret
            ):
                raise ValueError(
                    "Production configuration error: Default development SESSION_SECRET is not permitted in production. "
                    "Set a secure, unique string (minimum 32 characters) in production environment variables."
                )
            if len(secret) < 32:
                raise ValueError(
                    "Production configuration error: SESSION_SECRET is too short. "
                    "Must be at least 32 characters long."
                )
        return self

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_google_configured(self) -> bool:
        return bool(
            self.GOOGLE_CLIENT_ID
            and self.GOOGLE_CLIENT_SECRET
            and not self.GOOGLE_CLIENT_ID.startswith("your-")
            and not self.GOOGLE_CLIENT_SECRET.startswith("your-")
        )

    @property
    def is_database_configured(self) -> bool:
        return bool(self.DATABASE_URL and not self.DATABASE_URL.startswith("your-"))

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )


def get_settings() -> Settings:
    return Settings()
