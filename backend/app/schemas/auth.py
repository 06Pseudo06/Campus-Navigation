"""Authentication and token schemas."""

import re
import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.user import UserRead, UserRole, EMAIL_REGEX


class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128, description="Password must be at least 8 characters")
    full_name: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = "student"

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError("Invalid email format.")
        return v


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserRead


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., min_length=10, description="Google OAuth ID Token from client authentication")


class PhoneSendOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20, description="Mobile number with country code, e.g. +919876543210")

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v.strip())
        if not re.match(r"^\+?[0-9]{10,15}$", cleaned):
            raise ValueError("Invalid phone number format. Provide valid mobile number (10-15 digits).")
        return cleaned


class PhoneVerifyOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    otp_code: str = Field(..., min_length=4, max_length=8)
    full_name: Optional[str] = Field(None, max_length=120)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v.strip())
        if not re.match(r"^\+?[0-9]{10,15}$", cleaned):
            raise ValueError("Invalid phone number format.")
        return cleaned


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
