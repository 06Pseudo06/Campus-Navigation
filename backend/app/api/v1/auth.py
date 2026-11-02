import logging
import urllib.parse
from datetime import datetime, timezone, timedelta
import inspect
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse

logger = logging.getLogger(__name__)

from app.config import Settings, get_settings
from app.core.security import (
    SecurityManager,
    get_security_manager,
    hash_password,
    verify_password,
)
from app.schemas.user import (
    ActionMessageResponse,
    ChangePasswordRequest,
    DeleteAccountRequest,
    LogoutResponse,
    ProfileUpdateRequest,
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
    try:
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
        except Exception as e:
            logger.error(f"[Google OAuth] Token exchange failed: {e}")
            err_text = str(e)
            if "redirect_uri_mismatch" in err_text:
                detail = "redirect_uri_mismatch"
            elif "invalid_grant" in err_text:
                detail = "invalid_grant"
            elif "invalid_client" in err_text:
                detail = "invalid_client"
            else:
                detail = urllib.parse.quote(err_text[:120])
            redirect = RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed&detail={detail}",
                status_code=status.HTTP_302_FOUND,
            )
            redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
            return redirect

        id_token_str = tokens.get("id_token")
        access_token = tokens.get("access_token")

        # 4. Verify user identity via ID Token or fallback to UserInfo API using access_token
        google_user: Optional[Any] = None

        if id_token_str:
            try:
                google_user = google_service.verify_id_token(id_token_str)
            except Exception as e:
                logger.warning(f"[Google OAuth] ID token verification failed: {e}. Trying UserInfo fallback.")

        if not google_user and access_token:
            try:
                google_user = await google_service.get_user_info_from_access_token(access_token)
                logger.info("[Google OAuth] Successfully verified user via Google UserInfo API fallback.")
            except Exception as e:
                logger.error(f"[Google OAuth] UserInfo fallback verification failed: {e}")

        if not google_user:
            logger.error("[Google OAuth] Could not verify Google user from provided tokens.")
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
        except Exception as db_err:
            logger.error(f"[Google OAuth] Database operation failed: {db_err}")
            redirect = RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=database_unavailable",
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

        try:
            await _resolve(
                user_repo.create_session(
                    user_id=user.id,
                    token_hash=token_hash,
                    expires_at=expires_at,
                    ip_address=client_ip,
                    user_agent=user_agent,
                )
            )
        except Exception as sess_err:
            logger.error(f"[Google OAuth] Session persistence failed: {sess_err}")
            redirect = RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=database_unavailable",
                status_code=status.HTTP_302_FOUND,
            )
            redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
            return redirect

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
    except Exception as unhandled:
        logger.error(f"[Google OAuth] Unhandled callback error: {unhandled}", exc_info=True)
        detail_msg = urllib.parse.quote(str(unhandled)[:100])
        fail_redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_error&detail={detail_msg}",
            status_code=status.HTTP_302_FOUND,
        )
        fail_redirect.delete_cookie(key=settings.STATE_COOKIE_NAME, path="/")
        return fail_redirect


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

    # 1. Cryptographic signature and envelope extraction
    token_data = security_manager.extract_session_token_data(
        session_token=session_token,
        max_age_seconds=settings.SESSION_REMEMBER_ME_MAX_AGE_SECONDS,
    )
    if not token_data or "user_id" not in token_data or "token_hash" not in token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    # 2. Server-side session validation (strictly against Neon database)
    try:
        session_record = await _resolve(
            user_repo.get_session_by_token_hash(token_data["token_hash"])
        )
    except Exception as e:
        logger.error(f"[Session] Database query for session failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please verify connectivity.",
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

    try:
        user = await _resolve(user_repo.get_by_id(token_data["user_id"]))
    except Exception as e:
        logger.error(f"[Session] Database query for user failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please verify connectivity.",
        )

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


def _build_user_response(user: Any, session_record: Any = None) -> UserResponse:
    """Helper to populate UserResponse with enriched auth and session metadata."""
    auth_provider = "google" if getattr(user, "google_sub", None) else "email"
    has_password = bool(getattr(user, "password_hash", None))
    token_hash = getattr(session_record, "token_hash", "") if session_record else ""
    session_id = f"sess_{token_hash[:10]}" if token_hash else None
    expires_at = getattr(session_record, "expires_at", None) if session_record else None

    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        picture=user.picture,
        email_verified=user.email_verified,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        auth_provider=auth_provider,
        has_password=has_password,
        role=getattr(user, "role", "student"),
        session_id=session_id,
        session_expires_at=expires_at,
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
    user, session_record = await _get_authenticated_user_and_session(
        request, settings, security_manager, user_repo
    )
    return _build_user_response(user, session_record)


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

    clean_name = payload.name.strip()
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

    if not getattr(user, "password_hash", None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is authenticated through Google and does not use an independent password.",
        )

    # 1. Verify current password
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    # 2. Validate new password length
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long.",
        )

    # 3. Ensure new password differs from current
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the current password.",
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

    # 5. Clear session cookie with immediate epoch expiration
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value="",
        max_age=0,
        expires=datetime(1970, 1, 1, tzinfo=timezone.utc),
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
    )

    return ActionMessageResponse(
        success=True,
        message="Your CampusWay account and all associated personal data have been permanently deleted.",
    )


@router.post("/logout", response_model=LogoutResponse, summary="Log Out")
@router.get("/logout", summary="Log Out (Redirect)")
async def logout(
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
    security_manager: SecurityManager = Depends(get_security_manager),
    user_repo: Any = Depends(get_user_repository),
):
    """
    Clears the backend session cookie and invalidates the session server-side.
    Guarantees cookie deletion even if database operations fail.
    """
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_token:
        token_data = security_manager.extract_session_token_data(
            session_token=session_token,
            max_age_seconds=settings.SESSION_REMEMBER_ME_MAX_AGE_SECONDS,
        )
        if token_data and "token_hash" in token_data:
            token_hash = token_data["token_hash"]
            # Revoke in persistent database
            try:
                await _resolve(user_repo.revoke_session(token_hash))
            except Exception as e:
                logger.warning(f"[Logout] Database revocation failed: {e}")

    # Force immediate irreversible cookie deletion across all browsers
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value="",
        max_age=0,
        expires=datetime(1970, 1, 1, tzinfo=timezone.utc),
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
    )

    # If invoked via GET (browser direct link), redirect to login page
    if request.method == "GET":
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?notice=logged_out",
            status_code=status.HTTP_302_FOUND,
        )
        redirect.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value="",
            max_age=0,
            expires=datetime(1970, 1, 1, tzinfo=timezone.utc),
            path="/",
            httponly=True,
            samesite="lax",
            secure=settings.is_production,
        )
        return redirect

    return LogoutResponse(success=True, message="Logged out successfully")
