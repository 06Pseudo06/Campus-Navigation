from datetime import datetime, timezone, timedelta
import inspect
import logging
import secrets
from typing import Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse

logger = logging.getLogger("campusway.auth")

from app.config import Settings, get_settings
from app.core.security import (
    SecurityManager,
    create_access_token,
    decode_access_token,
    get_security_manager,
    hash_password,
    verify_password,
)
from app.schemas.auth import (
    GoogleLoginRequest,
    PhoneSendOTPRequest,
    PhoneVerifyOTPRequest,
)
from app.schemas.user import (
    ActionMessageResponse,
    ChangePasswordRequest,
    DeleteAccountRequest,
    GoogleUserInfo,
    LogoutResponse,
    ProfileUpdateRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.google_auth import GoogleOAuthService, get_google_oauth_service
from app.services.user_store import get_user_repository

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _build_user_response(
    user: Any,
    session_record: Any = None,
    access_token: Optional[str] = None,
) -> UserResponse:
    """Helper to populate UserResponse with enriched auth and session metadata."""
    auth_provider = "google" if getattr(user, "google_sub", None) else "email"
    has_password = bool(getattr(user, "password_hash", None))
    token_hash = getattr(session_record, "token_hash", "") if session_record else ""
    session_id = f"sess_{token_hash[:10]}" if token_hash else None
    expires_at = getattr(session_record, "expires_at", None) if session_record else None
    role = getattr(user, "role", "student")
    user_name = getattr(user, "name", None) or getattr(user, "full_name", None)

    user_dict = {
        "id": str(user.id),
        "email": user.email,
        "full_name": user_name,
        "name": user_name,
        "phone": getattr(user, "phone", None),
        "role": role,
        "is_active": getattr(user, "is_active", True),
    }

    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user_name,
        phone=getattr(user, "phone", None),
        picture=getattr(user, "picture", None),
        email_verified=getattr(user, "email_verified", False),
        created_at=user.created_at,
        last_login_at=getattr(user, "last_login_at", None),
        auth_provider=auth_provider,
        has_password=has_password,
        role=role,
        session_id=session_id,
        session_expires_at=expires_at,
        access_token=access_token,
        token_type="bearer" if access_token else None,
        user=user_dict,
    )


async def _get_authenticated_user_and_session(
    request: Request,
    settings: Settings,
    security_manager: SecurityManager,
    user_repo: Any,
) -> tuple[Any, Any]:
    """Helper to validate session cookie, token hash, revocation, expiry, and active status."""
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token_data = security_manager.extract_session_token_data(
        session_token=session_token,
        max_age_seconds=settings.SESSION_REMEMBER_ME_MAX_AGE_SECONDS,
    )
    if not token_data or "user_id" not in token_data or "token_hash" not in token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    session_record = await _resolve(
        user_repo.get_session_by_token_hash(token_data["token_hash"])
    )
    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    if getattr(session_record, "is_revoked", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked",
        )

    now = datetime.now(timezone.utc)
    expires_at = getattr(session_record, "expires_at", None)
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid",
            )

    user = await _resolve(user_repo.get_by_id(token_data["user_id"]))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in session store",
        )

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    return user, session_record


async def _resolve(val: Any) -> Any:
    """Helper to transparently await coroutines from async repositories or return sync results."""
    if inspect.isawaitable(val):
        return await val
    return val


@router.get("/google/login", summary="Initiate Google OAuth 2.0 Login")
async def google_login(
    request: Request,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    google_service: GoogleOAuthService = Depends(get_google_oauth_service),
):
    """
    Redirects user to Google OAuth consent screen.
    Generates a secure signed state cookie to protect against CSRF attacks.
    """
    if not settings.is_google_configured:
        # Redirect back to frontend login page with a safe informative error
        redirect_url = f"{settings.FRONTEND_URL}/login?error=google_not_configured"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    # Generate secure state token
    state = security_manager.generate_oauth_state()
    auth_url = google_service.get_authorization_url(state=state)

    response = RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key=settings.STATE_COOKIE_NAME,
        value=state,
        max_age=settings.STATE_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )
    return response


@router.get("/google/callback", summary="Google OAuth 2.0 Authorization Callback")
async def google_callback(
    request: Request,
    response: Response,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    google_service: GoogleOAuthService = Depends(get_google_oauth_service),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Receives callback from Google OAuth.
    Validates state, exchanges authorization code for tokens, verifies ID token,
    creates/updates the temporary user, and establishes an HTTP-only session cookie.
    """
    # 1. Handle user cancellation or provider error
    if error:
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=cancelled",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # 2. Validate OAuth state to prevent Login CSRF
    stored_state = request.cookies.get(settings.STATE_COOKIE_NAME)
    if (
        not state
        or not stored_state
        or state != stored_state
        or not security_manager.verify_oauth_state(state, settings.STATE_MAX_AGE_SECONDS)
    ):
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=invalid_state",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    if not code:
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=missing_code",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # 3. Exchange authorization code for Google tokens
    try:
        tokens = await google_service.exchange_code_for_tokens(code)
    except Exception as exc:
        logger.error("Google OAuth token exchange failed: %s", exc)
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    id_token_str = tokens.get("id_token")
    if not id_token_str:
        logger.error("Google token response missing id_token")
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=missing_id_token",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # 4. Verify ID Token signature, issuer, audience, and claims
    try:
        google_user = google_service.verify_id_token(id_token_str)
    except Exception as exc:
        logger.error("Google ID token verification failed: %s", exc)
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=invalid_token",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # 5. Get or create user keyed by Google `sub`
    try:
        user = await _resolve(user_repo.get_or_create_from_google(google_user))
    except ValueError as exc:
        # Security rule: account linking conflict when email exists without Google identity
        logger.warning("Account linking conflict: %s", exc)
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=account_linking_conflict",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # Reject inactive account upfront
    if not getattr(user, "is_active", True):
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=account_inactive",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # 6. Establish backend-owned session in database
    session_max_age = settings.SESSION_DEFAULT_MAX_AGE_SECONDS
    raw_token, token_hash = security_manager.generate_token_pair()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=session_max_age)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    await _resolve(
        user_repo.create_session(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent,
        )
    )

    session_token = security_manager.create_session_token(
        user_id=user.id,
        google_sub=user.google_sub,
        raw_token=raw_token,
    )

    # Redirect to explore dashboard with clean state
    success_redirect = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/explore?auth=success",
        status_code=status.HTTP_302_FOUND,
    )

    # Attach HTTP-only session cookie
    success_redirect.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        max_age=session_max_age,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )

    # Clear single-use state cookie
    success_redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
    return success_redirect


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User with Email and Password",
)
async def register(
    payload: UserRegisterRequest,
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Registers a new user with email and password using Argon2id hashing.
    Establishes an HTTP-only authenticated session cookie backed by server-side storage and returns the user profile.
    """
    normalized_email = payload.email.strip().lower()

    # 1. Check for existing user with this email
    existing_user = await _resolve(user_repo.get_by_email(normalized_email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 2. Hash password securely using Argon2id
    hashed_password = hash_password(payload.password)

    # 3. Create user and credential records in one transaction
    assigned_role = getattr(payload, "role", None) or "student"
    full_name = payload.full_name or payload.name or ""
    try:
        user = await _resolve(
            user_repo.create_email_user(
                email=normalized_email,
                name=full_name,
                password_hash=hashed_password,
                role=assigned_role,
            )
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 4. Create server-side session and attach HTTP-only cookie
    session_max_age = settings.SESSION_DEFAULT_MAX_AGE_SECONDS
    raw_token, token_hash = security_manager.generate_token_pair()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=session_max_age)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    await _resolve(
        user_repo.create_session(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent,
        )
    )

    session_token = security_manager.create_session_token(
        user_id=user.id,
        raw_token=raw_token,
    )
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        max_age=session_max_age,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )

    jwt_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": getattr(user, "role", assigned_role),
    })

    session_record = type("TempSession", (), {
        "token_hash": token_hash,
        "expires_at": expires_at,
    })()
    return _build_user_response(user, session_record, access_token=jwt_token)


@router.post(
    "/login",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Log In with Email and Password",
)
async def login(
    payload: UserLoginRequest,
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Authenticates user with email and password.
    Establishes an HTTP-only authenticated session cookie and returns the user profile.
    """
    normalized_email = payload.email.strip().lower()
    user = await _resolve(user_repo.get_by_email(normalized_email))
    if not user:
        if normalized_email == "admin@campusway.lpu.in":
            if hasattr(user_repo, "seed_admin_user"):
                user = await _resolve(user_repo.seed_admin_user())
            elif hasattr(getattr(user_repo, "_mem", None), "seed_admin_user"):
                user = await _resolve(user_repo._mem.seed_admin_user())
        elif normalized_email == "student@campusway.lpu.in":
            if hasattr(user_repo, "seed_student_user"):
                user = await _resolve(user_repo.seed_student_user())
            elif hasattr(getattr(user_repo, "_mem", None), "seed_student_user"):
                user = await _resolve(user_repo._mem.seed_student_user())

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Reject inactive accounts
    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was registered using Google Sign-In. Please sign in with Google.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Update last login timestamp
    updated_user = (await _resolve(user_repo.update_last_login(user.id))) or user

    # Determine session lifetime (30 days if remember_me, otherwise default 1 day)
    session_max_age = (
        settings.SESSION_REMEMBER_ME_MAX_AGE_SECONDS
        if payload.remember_me
        else settings.SESSION_DEFAULT_MAX_AGE_SECONDS
    )

    raw_token, token_hash = security_manager.generate_token_pair()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=session_max_age)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    await _resolve(
        user_repo.create_session(
            user_id=updated_user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent,
        )
    )

    session_token = security_manager.create_session_token(
        user_id=updated_user.id,
        raw_token=raw_token,
    )
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        max_age=session_max_age,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )

    jwt_token = create_access_token({
        "sub": str(updated_user.id),
        "email": updated_user.email,
        "role": getattr(updated_user, "role", "student"),
    })

    session_record = type("TempSession", (), {
        "token_hash": token_hash,
        "expires_at": expires_at,
    })()
    return _build_user_response(updated_user, session_record, access_token=jwt_token)


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Returns the currently authenticated user's profile from the session cookie or Bearer token.
    Rejects unauthenticated, revoked, or expired sessions with 401.
    """
    # 1. Try session cookie first
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_token:
        try:
            user, session_record = await _get_authenticated_user_and_session(
                request, settings, security_manager, user_repo
            )
            return _build_user_response(user, session_record)
        except HTTPException:
            if not authorization:
                raise

    # 2. Try Bearer token
    if authorization:
        parts = authorization.strip().split()
        raw_token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else authorization.strip()
        try:
            payload = decode_access_token(raw_token)
            sub = payload.get("sub")
            if sub:
                user = await _resolve(user_repo.get_by_id(sub))
                if user:
                    if not getattr(user, "is_active", True):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Account is inactive. Please contact support.",
                        )
                    return _build_user_response(user)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


@router.post("/google", response_model=UserResponse, summary="Google OAuth ID Token Sign-In")
async def google_id_token_sign_in(
    google_in: GoogleLoginRequest,
    response: Response,
    request: Request,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Authenticate or register user using a Google OAuth ID Token (e.g. Google One Tap or client SDK).
    """
    from app.services.auth_providers import google_auth_provider
    claims = google_auth_provider.verify_id_token(google_in.id_token)
    google_user = GoogleUserInfo(
        sub=claims["sub"],
        email=claims["email"],
        name=claims.get("name"),
        picture=claims.get("picture"),
        email_verified=claims.get("email_verified", True),
    )

    try:
        user = await _resolve(user_repo.get_or_create_from_google(google_user))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    session_max_age = settings.SESSION_DEFAULT_MAX_AGE_SECONDS
    raw_token, token_hash = security_manager.generate_token_pair()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=session_max_age)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    await _resolve(
        user_repo.create_session(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent,
        )
    )

    session_token = security_manager.create_session_token(
        user_id=user.id,
        google_sub=user.google_sub,
        raw_token=raw_token,
    )
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        max_age=session_max_age,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )

    jwt_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": getattr(user, "role", "student"),
    })

    session_record = type("TempSession", (), {
        "token_hash": token_hash,
        "expires_at": expires_at,
    })()
    return _build_user_response(user, session_record, access_token=jwt_token)


@router.post("/phone/send-otp", response_model=ActionMessageResponse, summary="Send Phone OTP")
async def send_phone_otp(
    payload: PhoneSendOTPRequest,
    settings: Settings = Depends(get_settings),
):
    from app.services.auth_providers import phone_otp_provider
    phone_otp_provider.send_otp(payload.phone)
    return ActionMessageResponse(
        success=True,
        message=f"Verification passcode dispatched to {payload.phone}.",
    )


@router.post("/phone/verify-otp", response_model=UserResponse, summary="Verify Phone OTP")
async def verify_phone_otp(
    payload: PhoneVerifyOTPRequest,
    response: Response,
    request: Request,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    from app.services.auth_providers import phone_otp_provider
    otp_val = getattr(payload, "otp_code", None) or getattr(payload, "otp", None) or ""
    is_valid = phone_otp_provider.verify_otp(payload.phone, otp_val)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification passcode.",
        )

    normalized_email = f"{payload.phone.replace('+', '')}@phone.campusway.local"
    user = await _resolve(user_repo.get_by_email(normalized_email))
    if not user:
        user = await _resolve(
            user_repo.create_email_user(
                email=normalized_email,
                name=payload.full_name or f"User {payload.phone[-4:]}",
                password_hash=hash_password(secrets.token_urlsafe(32)),
                role="student",
            )
        )
    setattr(user, "phone", payload.phone)

    session_max_age = settings.SESSION_DEFAULT_MAX_AGE_SECONDS
    raw_token, token_hash = security_manager.generate_token_pair()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=session_max_age)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    await _resolve(
        user_repo.create_session(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent,
        )
    )

    session_token = security_manager.create_session_token(
        user_id=user.id,
        raw_token=raw_token,
    )
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        max_age=session_max_age,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )

    jwt_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": getattr(user, "role", "student"),
    })

    session_record = type("TempSession", (), {
        "token_hash": token_hash,
        "expires_at": expires_at,
    })()
    return _build_user_response(user, session_record, access_token=jwt_token)


@router.patch("/profile", response_model=UserResponse, summary="Update User Profile Information")
async def update_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Updates editable profile details (e.g. display name) for the authenticated user.
    """
    user, session_record = await _get_authenticated_user_and_session(
        request, settings, security_manager, user_repo
    )

    clean_name = (payload.name or payload.full_name or "").strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name cannot be empty.",
        )

    updated_user = await _resolve(user_repo.update_profile(user.id, clean_name))
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile.",
        )

    return _build_user_response(updated_user, session_record)


@router.post("/change-password", response_model=ActionMessageResponse, summary="Change Password")
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Changes the password for an email/password account after verifying the current password.
    Rejects requests from Google-only accounts that have no password credentials.
    """
    user, _ = await _get_authenticated_user_and_session(
        request, settings, security_manager, user_repo
    )

    # 1. Reject Google-only accounts lacking password credentials
    if not getattr(user, "password_hash", None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account signs in with Google and does not use a password.",
        )

    # 2. Verify current password
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    # 3. Reject identical new password
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as your current password.",
        )

    # 4. Hash with Argon2id and update credentials
    new_hash = hash_password(payload.new_password)
    success = await _resolve(user_repo.update_password(user.id, new_hash))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password.",
        )

    return ActionMessageResponse(
        success=True,
        message="Password changed successfully.",
    )


@router.delete("/account", response_model=ActionMessageResponse, summary="Permanently Delete Account")
async def delete_account(
    payload: DeleteAccountRequest,
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Permanently deletes the authenticated user's account and personal data.
    Requires 'DELETE' confirmation word and current password verification (for email accounts).
    Revokes the active session and clears the session cookie.
    """
    user, session_record = await _get_authenticated_user_and_session(
        request, settings, security_manager, user_repo
    )

    # 1. Validate confirmation word
    if payload.confirm_text.strip().upper() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation text must be 'DELETE' to confirm permanent account deletion.",
        )

    # 2. If account has password credentials, verify password
    if getattr(user, "password_hash", None):
        if not payload.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required to confirm account deletion.",
            )
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password. Account deletion aborted.",
            )

    # 3. Revoke active session server-side
    token_hash = getattr(session_record, "token_hash", None)
    if token_hash:
        await _resolve(user_repo.revoke_session(token_hash))

    # 4. Delete user record (cascades to credentials, identities, sessions)
    deleted = await _resolve(user_repo.delete_user(user.id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account.",
        )

    # 5. Clear session cookie
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
    )

    return ActionMessageResponse(
        success=True,
        message="Your account and personal data have been permanently deleted.",
    )


@router.post("/logout", response_model=LogoutResponse, summary="Log Out")
async def logout(
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Clears the backend session cookie and invalidates the session server-side.
    """
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_token:
        token_data = security_manager.extract_session_token_data(
            session_token=session_token,
            max_age_seconds=settings.SESSION_REMEMBER_ME_MAX_AGE_SECONDS,
        )
        if token_data and "token_hash" in token_data:
            await _resolve(user_repo.revoke_session(token_data["token_hash"]))

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
    )
    return LogoutResponse(success=True, message="Logged out successfully")
