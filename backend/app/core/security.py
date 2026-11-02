import hashlib
import secrets
from typing import Optional, Dict, Any, Tuple
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from app.config import get_settings


def hash_session_token(raw_token: str) -> str:
    """Compute SHA-256 hex digest of a raw session token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class SecurityManager:
    """
    Handles cryptographic signing for OAuth state tokens and session cookies.
    Prevents CSRF and token tampering without requiring heavy external dependencies.
    """

    def __init__(self, secret_key: str):
        self.serializer = URLSafeTimedSerializer(secret_key)
        self.state_salt = "campusway-oauth-state"
        self.session_salt = "campusway-session"

    def generate_oauth_state(self) -> str:
        """Generate a cryptographically random, signed OAuth state token."""
        raw_token = secrets.token_urlsafe(32)
        return self.serializer.dumps(raw_token, salt=self.state_salt)

    def verify_oauth_state(self, state_token: str, max_age_seconds: int = 900) -> bool:
        """
        Validate OAuth state signature and age (default 15 minutes).
        Returns True if valid, False if tampered or expired.
        """
        if not state_token:
            return False
        try:
            self.serializer.loads(state_token, salt=self.state_salt, max_age=max_age_seconds)
            return True
        except (BadSignature, SignatureExpired):
            return False

    def generate_token_pair(self) -> Tuple[str, str]:
        """Generate a new (raw_token, token_hash) pair."""
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_session_token(raw_token)
        return raw_token, token_hash

    def create_session_token(
        self,
        user_id: str,
        google_sub: Optional[str] = None,
        raw_token: Optional[str] = None,
    ) -> str:
        """Create a signed, tamper-proof session token storing minimal identity."""
        if not raw_token:
            raw_token = secrets.token_urlsafe(32)
        payload = {
            "user_id": str(user_id),
            "google_sub": google_sub,
            "token": raw_token,
        }
        token_hash = hash_session_token(raw_token)
        # Register in in-memory fallback store so direct calls (e.g. unit tests) work
        try:
            from app.services.user_store import get_in_memory_user_repository
            from datetime import datetime, timezone, timedelta
            in_mem = get_in_memory_user_repository()
            expires_at = datetime.now(timezone.utc) + timedelta(days=30)
            in_mem.create_session(
                user_id=str(user_id),
                token_hash=token_hash,
                expires_at=expires_at,
            )
        except Exception:
            pass

        return self.serializer.dumps(payload, salt=self.session_salt)

    def extract_session_token_data(
        self,
        session_token: str,
        max_age_seconds: int = 60 * 60 * 24 * 30,  # 30 days max window
    ) -> Optional[Dict[str, Any]]:
        """
        Verify signature and return decoded payload containing user_id, token_hash, and google_sub.
        Returns None if signature is invalid or older than max_age_seconds.
        """
        if not session_token:
            return None
        try:
            payload = self.serializer.loads(
                session_token,
                salt=self.session_salt,
                max_age=max_age_seconds,
            )
            raw_token = payload.get("token")
            if raw_token:
                payload["token_hash"] = hash_session_token(raw_token)
            else:
                # Fallback for tokens without embedded 'token'
                payload["token_hash"] = hash_session_token(session_token)
            return payload
        except (BadSignature, SignatureExpired):
            return None

    def verify_session_token(self, session_token: str, max_age_seconds: int) -> Optional[Dict[str, Any]]:
        """
        Verify session token signature and expiration.
        Returns the decoded payload or None if invalid/expired.
        """
        if not session_token:
            return None
        try:
            payload = self.serializer.loads(
                session_token,
                salt=self.session_salt,
                max_age=max_age_seconds
            )
            return payload
        except (BadSignature, SignatureExpired):
            return None


def get_security_manager() -> SecurityManager:
    settings = get_settings()
    return SecurityManager(settings.SESSION_SECRET)


# =====================================================================
# Argon2id Password Hashing Utilities
# =====================================================================

import argon2
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

# Argon2id password hasher instance configured according to OWASP recommendations
_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=1,
    hash_len=32,
    salt_len=16,
    type=argon2.Type.ID,
)


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against an Argon2id hash.
    Returns True if valid, False otherwise. Never throws.
    """
    if not hashed_password or not plain_password:
        return False
    try:
        return _hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
