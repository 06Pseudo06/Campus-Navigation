from datetime import datetime, timezone, timedelta
import inspect
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse

from app.config import Settings, get_settings
from app.core.security import (
    SecurityManager,
    get_security_manager,
    hash_password,
    verify_password,
)
from app.schemas.user import (
    LogoutResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.google_auth import GoogleOAuthService, get_google_oauth_service
from app.services.user_store import get_user_repository

router = APIRouter(prefix="/auth", tags=["Authentication"])


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
    except Exception:
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    id_token_str = tokens.get("id_token")
    if not id_token_str:
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=missing_id_token",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # 4. Verify ID Token signature, issuer, audience, and claims
    try:
        google_user = google_service.verify_id_token(id_token_str)
    except Exception:
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=invalid_token",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return redirect

    # 5. Get or create user keyed by Google `sub`
    try:
        user = await _resolve(user_repo.get_or_create_from_google(google_user))
    except ValueError:
        # Security rule: account linking conflict when email exists without Google identity
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
    try:
        user = await _resolve(
            user_repo.create_email_user(
                email=normalized_email,
                name=payload.full_name,
                password_hash=hashed_password,
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

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        email_verified=user.email_verified,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


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

    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        picture=updated_user.picture,
        email_verified=updated_user.email_verified,
        created_at=updated_user.created_at,
        last_login_at=updated_user.last_login_at,
    )


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
async def get_current_user(
    request: Request,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Returns the currently authenticated user's profile from the session cookie.
    Rejects unauthenticated, revoked, or expired sessions with 401.
    """
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    # 1. Cryptographic signature and envelope extraction (up to max remember_me window)
    token_data = security_manager.extract_session_token_data(
        session_token=session_token,
        max_age_seconds=settings.SESSION_REMEMBER_ME_MAX_AGE_SECONDS,
    )
    if not token_data or "user_id" not in token_data or "token_hash" not in token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    # 2. Server-side session validation
    session_record = await _resolve(
        user_repo.get_session_by_token_hash(token_data["token_hash"])
    )
    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    # 3. Server-side revocation check
    if getattr(session_record, "is_revoked", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked",
        )

    # 4. Server-side expiration check
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

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        email_verified=user.email_verified,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
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
