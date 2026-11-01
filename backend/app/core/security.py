"""Security utilities for password hashing and cryptographic JWT operations."""

import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.config import settings


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with a cryptographically secure salt.
    
    Format: pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
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
    """Verify password against a PBKDF2-HMAC-SHA256 hash string."""
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
