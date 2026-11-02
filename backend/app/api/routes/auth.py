"""User authentication, registration, session, and provider endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    GoogleLoginRequest,
    LoginRequest,
    MessageResponse,
    PhoneSendOTPRequest,
    PhoneVerifyOTPRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services import auth_service
from app.services.auth_providers import google_auth_provider, phone_otp_provider

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    reg_in: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new campus user with email and password."""
    try:
        user, token = auth_service.register_user(db, reg_in)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.model_validate(user),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(
    login_in: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate existing user with email and password."""
    try:
        user, token = auth_service.authenticate_user(db, login_in.email, login_in.password)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.model_validate(user),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Retrieve full profile and identities for the currently authenticated user."""
    return UserRead.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
def logout(
    current_user: User = Depends(get_current_user),
):
    """Log out current user. In a stateless JWT architecture, the client discards the token."""
    return MessageResponse(
        message="Successfully logged out.",
        detail="Client session ended. Discard the local bearer token.",
    )


@router.post("/google", response_model=TokenResponse)
def google_sign_in(
    google_in: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate or register user using a Google OAuth ID Token."""
    try:
        user, token = auth_service.authenticate_google(db, google_in.id_token)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.model_validate(user),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/phone/send-otp", response_model=MessageResponse)
def send_phone_otp(
    otp_in: PhoneSendOTPRequest,
):
    """Dispatch SMS one-time verification passcode to mobile number."""
    phone_otp_provider.send_otp(otp_in.phone)
    return MessageResponse(
        message=f"Verification passcode dispatched to {otp_in.phone}.",
        detail="Enter the passcode to complete authentication.",
    )


@router.post("/phone/verify-otp", response_model=TokenResponse)
def verify_phone_otp(
    verify_in: PhoneVerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """Verify one-time passcode and complete user session."""
    try:
        user, token = auth_service.verify_phone_otp_and_login(
            db,
            phone=verify_in.phone,
            otp_code=verify_in.otp_code,
            full_name=verify_in.full_name,
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.model_validate(user),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
