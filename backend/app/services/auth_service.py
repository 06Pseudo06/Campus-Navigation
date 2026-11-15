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


def authenticate_firebase(db: Session, id_token: str) -> Tuple[User, str]:
    """Authenticate or register user via verified Firebase ID Token (Google, Phone OTP, Email)."""
    from app.services.firebase_auth import verify_firebase_id_token
    claims = verify_firebase_id_token(id_token)
    uid = claims["uid"]
    email = claims.get("email")
    full_name = claims.get("name")
    phone = claims.get("phone_number")
    provider_raw = claims.get("sign_in_provider", "firebase")

    if "google" in provider_raw:
        provider = "google"
    elif "phone" in provider_raw:
        provider = "phone_otp"
    else:
        provider = "firebase"

    # 1. Check existing identity by (provider, uid) or (provider="phone_otp", phone)
    identity = (
        db.query(UserIdentity)
        .filter(UserIdentity.provider == provider, UserIdentity.provider_subject == uid)
        .first()
    )
    if not identity and phone:
        identity = (
            db.query(UserIdentity)
            .filter(UserIdentity.provider == "phone_otp", UserIdentity.provider_subject == phone)
            .first()
        )

    if identity:
        user = db.query(User).filter(User.id == identity.user_id).first()
        if not user or not user.is_active:
            raise ValueError("User account is inactive or disabled.")
        updated = False
        if full_name and user.full_name != full_name:
            user.full_name = full_name
            updated = True
        if email and user.email != email:
            user.email = email
            updated = True
        if phone and user.phone != phone:
            user.phone = phone
            updated = True
        if updated:
            db.commit()
            db.refresh(user)
    else:
        user = None
        if email:
            user = db.query(User).filter(User.email == email).first()
        if not user and phone:
            user = db.query(User).filter(User.phone == phone).first()

        if not user:
            user = User(
                full_name=full_name or (f"Campus Visitor ({phone[-4:]})" if phone else (email.split("@")[0] if email else "Campus User")),
                email=email,
                phone=phone,
                role="student",
                is_active=True,
            )
            db.add(user)
            db.flush()

        identity = UserIdentity(
            user_id=user.id,
            provider=provider,
            provider_subject=uid,
        )
        db.add(identity)
        db.commit()
        db.refresh(user)

    token_payload = {
        "sub": str(user.id),
        "role": user.role,
    }
    if user.email:
        token_payload["email"] = user.email
    if user.phone:
        token_payload["phone"] = user.phone

    token = create_access_token(token_payload)
    return user, token


def authenticate_google(db: Session, id_token: str) -> Tuple[User, str]:
    """Authenticate or register user via verified Google OAuth or Firebase ID Token."""
    # If a mock verifier is active on google_auth_provider (test suite), use it directly
    if google_auth_provider._mock_verifier:
        claims = google_auth_provider.verify_id_token(id_token)
    else:
        # Attempt Firebase ID token verification first
        try:
            from app.services.firebase_auth import is_firebase_configured
            if is_firebase_configured():
                return authenticate_firebase(db, id_token)
        except Exception:
            pass
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
