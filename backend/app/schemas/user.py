from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class GoogleUserInfo(BaseModel):
    """Normalized payload verified from Google ID Token."""
    sub: str = Field(..., description="Google stable unique user ID")
    email: EmailStr = Field(..., description="User's primary Google email")
    email_verified: bool = Field(default=False)
    name: Optional[str] = Field(default=None)
    picture: Optional[str] = Field(default=None)


class UserProfile(BaseModel):
    """Internal user model stored in the repository."""
    id: str = Field(..., description="Internal CampusWay unique user identifier")
    google_sub: Optional[str] = Field(default=None, description="Associated Google sub identifier if signed in via Google")
    email: str = Field(..., description="Email address")
    name: Optional[str] = None
    picture: Optional[str] = None
    password_hash: Optional[str] = Field(default=None, description="Argon2id password hash for email/password users")
    email_verified: bool = False
    is_active: bool = True
    created_at: datetime
    last_login_at: datetime


class UserRegisterRequest(BaseModel):
    """Payload for POST /api/v1/auth/register."""
    full_name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 characters)")


class UserLoginRequest(BaseModel):
    """Payload for POST /api/v1/auth/login."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, max_length=128, description="Password")
    remember_me: bool = Field(default=False, description="Extend session duration")


class UserResponse(BaseModel):
    """Safe public representation of user for client consumption (/auth/me, /auth/register, /auth/login)."""
    id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: bool = False
    created_at: datetime
    last_login_at: datetime


class LogoutResponse(BaseModel):
    success: bool = True
    message: str = "Logged out successfully"
