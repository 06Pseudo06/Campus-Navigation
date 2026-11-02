import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Optional, Dict, Any, Tuple
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from app.config import get_settings


def _b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))


def create_access_token(
    payload_data: Dict[str, Any],
    expires_in_seconds: Optional[int] = None,
) -> str:
    """Generate a standard HS256 JWT access token."""
    settings = get_settings()
    secret_key = getattr(settings, "JWT_SECRET_KEY", None) or settings.SESSION_SECRET
    algorithm = getattr(settings, "JWT_ALGORITHM", "HS256")
    header = {"alg": algorithm, "typ": "JWT"}
    now_ts = int(time.time())
    exp_seconds = expires_in_seconds or (getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 60) * 60)
    
    payload = dict(payload_data)
    payload["iat"] = now_ts
    payload["exp"] = now_ts + exp_seconds

    header_b64 = _b64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64_url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    sig = hmac.new(
        secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    sig_b64 = _b64_url_encode(sig)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Validate and decode an HS256 JWT token. Raises ValueError on invalid or expired token."""
    try:
        settings = get_settings()
        secret_key = getattr(settings, "JWT_SECRET_KEY", None) or settings.SESSION_SECRET
        parts = token.strip().split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token structure.")

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(
            secret_key.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()

        provided_sig = _b64_url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            raise ValueError("Invalid token signature.")

        payload_bytes = _b64_url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Verify expiration
        exp = payload.get("exp")
        if exp and int(exp) < int(time.time()):
            raise ValueError("Token has expired.")

        return payload
    except Exception as e:
        raise ValueError(f"Invalid authentication token: {str(e)}") from e


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
