"""User and external identity Pydantic schemas.

Provides both core campus user models and extended session/credential schemas
without external email-validator dependencies.
"""

import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


UserRole = Literal["student", "admin", "moderator"]
EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


def _clean_email(v: Optional[str]) -> Optional[str]:
    if v is not None:
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError("Invalid email format.")
    return v


# --- Extended Auth & Session Schemas ---

class GoogleUserInfo(BaseModel):
    """Normalized payload verified from Google ID Token."""
    sub: str = Field(..., description="Google stable unique user ID")
    email: str = Field(..., description="User's primary Google email")
    email_verified: bool = Field(default=False)
    name: Optional[str] = Field(default=None)
    picture: Optional[str] = Field(default=None)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _clean_email(v) or v


class UserProfile(BaseModel):
    """Internal user model stored in the repository."""
    id: str = Field(..., description="Internal CampusWay unique user identifier")
    google_sub: Optional[str] = Field(default=None, description="Associated Google sub identifier if signed in via Google")
    email: str = Field(..., description="Email address")
    name: Optional[str] = None
    phone: Optional[str] = None
    picture: Optional[str] = None
    password_hash: Optional[str] = Field(default=None, description="Password hash for email/password users")
    email_verified: bool = False
    is_active: bool = True
    role: str = "student"
    created_at: datetime
    last_login_at: datetime


class UserRegisterRequest(BaseModel):
    """Payload for POST /api/v1/auth/register (session-based)."""
    full_name: Optional[str] = Field(default=None, max_length=100, description="User's full name")
    name: Optional[str] = Field(default=None, max_length=100, description="User's full name alias")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 characters)")
    role: Optional[str] = Field(default="student", description="Role: student, admin, moderator")

    @model_validator(mode="before")
    @classmethod
    def populate_names(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fn = data.get("full_name") or data.get("name")
            if fn:
                data["full_name"] = fn.strip()
                data["name"] = fn.strip()
            else:
                raise ValueError("Full name is required.")
        return data

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _clean_email(v) or v


class UserLoginRequest(BaseModel):
    """Payload for POST /api/v1/auth/login (session-based)."""
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, max_length=128, description="Password")
    remember_me: bool = Field(default=False, description="Extend session duration")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _clean_email(v) or v


class UserResponse(BaseModel):
    """Safe public representation of user for client consumption (/auth/me, /auth/register, /auth/login, /auth/profile)."""
    id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    picture: Optional[str] = None
    email_verified: bool = False
    created_at: datetime
    last_login_at: Optional[datetime] = None
    auth_provider: str = "email"
    has_password: bool = False
    role: str = "student"
    session_id: Optional[str] = None
    session_expires_at: Optional[datetime] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional[Dict[str, Any]] = None


class ProfileUpdateRequest(BaseModel):
    """Payload for PATCH /api/v1/auth/profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=120, description="Updated display or full name")
    full_name: Optional[str] = Field(None, min_length=1, max_length=120, description="Updated display or full name")


class ChangePasswordRequest(BaseModel):
    """Payload for POST /api/v1/auth/change-password."""
    current_password: str = Field(..., min_length=1, max_length=128, description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password (min 8 characters)")
    confirm_password: Optional[str] = Field(None, min_length=8, max_length=128, description="Confirmation password")


class DeleteAccountRequest(BaseModel):
    """Payload for DELETE /api/v1/auth/account."""
    password: Optional[str] = Field(None, max_length=128, description="Current password if password-protected account")
    confirm_text: str = Field(..., description="Confirmation word, e.g. 'DELETE'")


class ActionMessageResponse(BaseModel):
    success: bool = True
    message: str


class LogoutResponse(BaseModel):
    """Response payload for POST /api/v1/auth/logout."""
    success: bool = True
    message: str = "Logged out successfully"


# --- Core CampusWay User Schemas ---

class UserBase(BaseModel):
    full_name: Optional[str] = Field(None, max_length=120)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = "student"
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        return _clean_email(v)


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=120)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        return _clean_email(v)


class UserIdentityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    provider: str
    provider_subject: str
    created_at: datetime


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    identities: List[UserIdentityRead] = []
