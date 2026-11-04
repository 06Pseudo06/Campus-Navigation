"""Security utilities for password hashing, cryptographic JWT operations, and session cookies.

Zero-dependency standard library implementation supporting both stateless JWT Bearer
tokens and server-side signed session cookies.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, Dict, Optional, Tuple

from app.core.config import settings


# =====================================================================
# Exception Classes & Timed Serializer Fallback
# =====================================================================

class BadSignature(Exception):
    """Raised when a cryptographic signature does not match."""
    pass


class SignatureExpired(BadSignature):
    """Raised when a signed token has exceeded its maximum lifetime."""
    pass


class BuiltinTimedSerializer:
    """Pure Python HMAC-SHA256 URL-safe timed serializer.
    
    Compatible with itsdangerous.URLSafeTimedSerializer without requiring external packages.
    """

    def __init__(self, secret_key: str):
        self.secret_key = secret_key.encode("utf-8")

    def _get_key(self, salt: str) -> bytes:
        return hashlib.sha256(self.secret_key + b"|" + salt.encode("utf-8")).digest()

    def dumps(self, obj: Any, salt: str = "default") -> str:
        payload_bytes = json.dumps(obj, separators=(",", ":")).encode("utf-8")
        payload_b64 = _b64_url_encode(payload_bytes)
        ts = int(time.time())
        ts_b64 = _b64_url_encode(str(ts).encode("utf-8"))
        signing_input = f"{payload_b64}.{ts_b64}".encode("utf-8")
        sig = hmac.new(self._get_key(salt), signing_input, hashlib.sha256).digest()
        sig_b64 = _b64_url_encode(sig)
        return f"{payload_b64}.{ts_b64}.{sig_b64}"

    def loads(self, token: str, salt: str = "default", max_age: Optional[int] = None) -> Any:
        if not token:
            raise BadSignature("Empty token")
        parts = token.strip().split(".")
        if len(parts) != 3:
            raise BadSignature("Malformed token format")

        payload_b64, ts_b64, sig_b64 = parts
        signing_input = f"{payload_b64}.{ts_b64}".encode("utf-8")
        expected_sig = hmac.new(self._get_key(salt), signing_input, hashlib.sha256).digest()
        try:
            provided_sig = _b64_url_decode(sig_b64)
            if not hmac.compare_digest(expected_sig, provided_sig):
                raise BadSignature("Invalid signature")
            ts_bytes = _b64_url_decode(ts_b64)
            ts = int(ts_bytes.decode("utf-8"))
            if max_age is not None and (int(time.time()) - ts) > max_age:
                raise SignatureExpired("Token signature has expired")
            payload_bytes = _b64_url_decode(payload_b64)
            return json.loads(payload_bytes.decode("utf-8"))
        except (BadSignature, SignatureExpired):
            raise
        except Exception as e:
            raise BadSignature(f"Token decoding error: {e}") from e


# Export URLSafeTimedSerializer
try:
    from itsdangerous import URLSafeTimedSerializer as _ExternalSerializer
    URLSafeTimedSerializer = _ExternalSerializer
except ImportError:
    URLSafeTimedSerializer = BuiltinTimedSerializer


# =====================================================================
# Base64 URL Helpers
# =====================================================================

def _b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))


# =====================================================================
# Password Hashing & Verification
# =====================================================================

# Try loading Argon2id if installed
_argon2_hasher = None
try:
    import argon2
    from argon2 import PasswordHasher
    _argon2_hasher = PasswordHasher(
        time_cost=2,
        memory_cost=65536,
        parallelism=1,
        hash_len=32,
        salt_len=16,
        type=argon2.Type.ID,
    )
except ImportError:
    _argon2_hasher = None


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 (default) or Argon2id if installed.
    
    Default Format: pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
    """
    if not salt:
        salt = secrets.token_hex(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against either PBKDF2-HMAC-SHA256 or Argon2id hash."""
    if not hashed_password or not plain_password:
        return False

    # Check Argon2 format ($argon2id$ or $argon2i$)
    if hashed_password.startswith("$argon2"):
        if _argon2_hasher is not None:
            try:
                return _argon2_hasher.verify(hashed_password, plain_password)
            except Exception:
                return False
        return False

    # Check PBKDF2 format
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hex = parts[3]

        derived = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return hmac.compare_digest(derived.hex(), expected_hex)
    except Exception:
        return False


# =====================================================================
# Stateless JWT Tokens (CampusWay Core Contract)
# =====================================================================

def create_access_token(
    payload_data: Dict[str, Any],
    expires_in_seconds: Optional[int] = None,
) -> str:
    """Generate a standard HS256 JWT access token."""
    header = {"alg": settings.JWT_ALGORITHM, "typ": "JWT"}
    now_ts = int(time.time())
    exp_seconds = expires_in_seconds or (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    payload = dict(payload_data)
    payload["iat"] = now_ts
    payload["exp"] = now_ts + exp_seconds

    header_b64 = _b64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64_url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    sig = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    sig_b64 = _b64_url_encode(sig)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Validate and decode an HS256 JWT token. Raises ValueError on invalid or expired token."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token structure.")

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
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


# =====================================================================
# Server-side Session Management & OAuth State
# =====================================================================

def hash_session_token(raw_token: str) -> str:
    """Compute SHA-256 hex digest of a raw session token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class SecurityManager:
    """Handles cryptographic signing for OAuth state tokens and session cookies."""

    def __init__(self, secret_key: str):
        self.serializer = URLSafeTimedSerializer(secret_key)
        self.state_salt = "campusway-oauth-state"
        self.session_salt = "campusway-session"

    def generate_oauth_state(self) -> str:
        """Generate a cryptographically random, signed OAuth state token."""
        raw_token = secrets.token_urlsafe(32)
        return self.serializer.dumps(raw_token, salt=self.state_salt)

    def verify_oauth_state(self, state_token: str, max_age_seconds: int = 900) -> bool:
        """Validate OAuth state signature and age."""
        if not state_token:
            return False
        try:
            self.serializer.loads(state_token, salt=self.state_salt, max_age=max_age_seconds)
            return True
        except (BadSignature, SignatureExpired, Exception):
            return False

    def generate_token_pair(self) -> Tuple[str, str]:
        """Generate a new (raw_token, token_hash) pair."""
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_session_token(raw_token)
        return raw_token, token_hash

    def create_session_token(
        self,
        user_id: Any,
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
        max_age_seconds: int = 60 * 60 * 24 * 30,
    ) -> Optional[Dict[str, Any]]:
        """Verify signature and return decoded payload."""
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
                payload["token_hash"] = hash_session_token(session_token)
            return payload
        except (BadSignature, SignatureExpired, Exception):
            return None

    def verify_session_token(self, session_token: str, max_age_seconds: int) -> Optional[Dict[str, Any]]:
        """Verify session token signature and expiration."""
        if not session_token:
            return None
        try:
            return self.serializer.loads(
                session_token,
                salt=self.session_salt,
                max_age=max_age_seconds,
            )
        except (BadSignature, SignatureExpired, Exception):
            return None


def get_security_manager() -> SecurityManager:
    return SecurityManager(settings.SESSION_SECRET)
