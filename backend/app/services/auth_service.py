"""Authentication and identity lifecycle business service."""

import uuid
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserIdentity
from app.schemas.auth import RegisterRequest
from app.services.auth_providers import google_auth_provider, phone_otp_provider


def register_user(db: Session, reg_in: RegisterRequest) -> Tuple[User, str]:
    """Register a new user profile with password authentication."""
    # Check email conflict
    existing_email = db.query(User).filter(User.email == reg_in.email).first()
    if existing_email:
        raise ValueError("A user with this email address already exists.")

    if reg_in.phone:
        existing_phone = db.query(User).filter(User.phone == reg_in.phone).first()
        if existing_phone:
            raise ValueError("A user with this phone number already exists.")

    # Create User
    user = User(
        full_name=reg_in.full_name,
        email=reg_in.email,
        phone=reg_in.phone,
        role=reg_in.role,
        is_active=True,
    )
    db.add(user)
    db.flush()  # Generate user.id

    # Create Password Identity
    hashed_pw = hash_password(reg_in.password)
    identity = UserIdentity(
        user_id=user.id,
        provider="password",
        provider_subject=hashed_pw,
    )
    db.add(identity)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
    })
    return user, token


def authenticate_user(db: Session, email: str, password: str) -> Tuple[User, str]:
    """Authenticate user with email and password credentials."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise ValueError("Invalid email or password.")

    # Find password identity
    identity = (
        db.query(UserIdentity)
        .filter(UserIdentity.user_id == user.id, UserIdentity.provider == "password")
        .first()
    )
    if not identity:
        raise ValueError("Invalid email or password.")

    if not verify_password(password, identity.provider_subject):
        raise ValueError("Invalid email or password.")

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
    })
    return user, token


def authenticate_google(db: Session, id_token: str) -> Tuple[User, str]:
    """Authenticate or register user via verified Google OAuth ID Token."""
    claims = google_auth_provider.verify_id_token(id_token)
    sub = claims["sub"]
    email = claims.get("email")
    full_name = claims.get("full_name")

    if not sub:
        raise ValueError("Google identity does not provide a valid subject identifier.")

    # 1. Check existing Google identity
    identity = (
        db.query(UserIdentity)
        .filter(UserIdentity.provider == "google", UserIdentity.provider_subject == sub)
        .first()
    )

    if identity:
        user = db.query(User).filter(User.id == identity.user_id).first()
        if not user or not user.is_active:
            raise ValueError("User account is inactive or disabled.")
    else:
        # Check if email is already registered
        user = db.query(User).filter(User.email == email).first() if email else None
        if not user:
            user = User(
                full_name=full_name,
                email=email,
                role="student",
                is_active=True,
            )
            db.add(user)
            db.flush()

        # Link identity
        identity = UserIdentity(
            user_id=user.id,
            provider="google",
            provider_subject=sub,
        )
        db.add(identity)
        db.commit()
        db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
    })
    return user, token


def verify_phone_otp_and_login(
    db: Session,
    phone: str,
    otp_code: str,
    full_name: Optional[str] = None,
) -> Tuple[User, str]:
    """Verify phone OTP passcode and return authenticated user session."""
    is_valid = phone_otp_provider.verify_otp(phone, otp_code)
    if not is_valid:
        raise ValueError("Invalid or expired verification passcode.")

    identity = (
        db.query(UserIdentity)
        .filter(UserIdentity.provider == "phone_otp", UserIdentity.provider_subject == phone)
        .first()
    )

    if identity:
        user = db.query(User).filter(User.id == identity.user_id).first()
        if not user or not user.is_active:
            raise ValueError("User account is inactive or disabled.")
    else:
        user = db.query(User).filter(User.phone == phone).first()
        if not user:
            user = User(
                full_name=full_name or f"Campus Visitor ({phone[-4:]})",
                phone=phone,
                role="student",
                is_active=True,
            )
            db.add(user)
            db.flush()

        identity = UserIdentity(
            user_id=user.id,
            provider="phone_otp",
            provider_subject=phone,
        )
        db.add(identity)
        db.commit()
        db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "phone": user.phone,
        "role": user.role,
    })
    return user, token


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """Retrieve user profile by primary key UUID."""
    return db.query(User).filter(User.id == user_id).first()
