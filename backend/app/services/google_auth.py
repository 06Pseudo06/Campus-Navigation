import logging
import urllib.parse
from typing import Optional
import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import Settings, get_settings
from app.schemas.user import GoogleUserInfo

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
VALID_GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


class GoogleOAuthService:
    """
    Handles Google OAuth 2.0 Authorization Code flow, ID token verification,
    and server-side UserInfo identity retrieval.
    """

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()

    def get_authorization_url(self, state: str) -> str:
        """
        Build the Google OAuth 2.0 authorization URL with requested scopes,
        the secure state parameter, and prompt=select_account so users can
        select their Google account on sign-in.
        """
        params = {
            "client_id": self.settings.GOOGLE_CLIENT_ID,
            "redirect_uri": self.settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
        return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> dict:
        """
        Exchange the received authorization code for tokens at Google's token endpoint.
        Returns the token response dictionary containing `id_token` and `access_token`.
        """
        payload = {
            "code": code,
            "client_id": self.settings.GOOGLE_CLIENT_ID,
            "client_secret": self.settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": self.settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=payload)

        if response.status_code != 200:
            error_data = response.json() if "application/json" in response.headers.get("content-type", "") else {}
            error_code = error_data.get("error", "unknown")
            error_desc = error_data.get("error_description", f"Status {response.status_code}")
            logger.error(
                f"[Google OAuth] Token exchange failed ({response.status_code}): {error_code} - {error_desc}. "
                f"Configured redirect_uri was: {self.settings.GOOGLE_REDIRECT_URI}"
            )
            raise ValueError(f"Google token exchange failed: {error_code} ({error_desc})")

        return response.json()

    def verify_id_token(self, id_token_str: str) -> GoogleUserInfo:
        """
        Verify the Google ID token using Google's official `verify_oauth2_token`.
        Validates token signature, certificates, expiration, issuer, and audience.
        Includes a 10-second clock skew tolerance for local machine time discrepancies.
        """
        request = google_requests.Request()
        try:
            payload = google_id_token.verify_oauth2_token(
                id_token_str,
                request,
                audience=self.settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10,
            )
        except Exception as e:
            logger.warning(f"[Google OAuth] verify_oauth2_token failed: {e}")
            raise ValueError(f"Invalid Google ID token: {str(e)}")

        # Verify token issuer
        issuer = payload.get("iss", "")
        if issuer not in VALID_GOOGLE_ISSUERS:
            raise ValueError(f"Untrusted token issuer: {issuer}")

        # Ensure required identity claims exist
        sub = payload.get("sub")
        email = payload.get("email")

        if not sub:
            raise ValueError("Google ID token missing required 'sub' claim.")
        if not email:
            raise ValueError("Google ID token missing required 'email' claim.")

        return GoogleUserInfo(
            sub=str(sub),
            email=str(email),
            email_verified=bool(payload.get("email_verified", False)),
            name=payload.get("name"),
            picture=payload.get("picture"),
        )

    async def get_user_info_from_access_token(self, access_token: str) -> GoogleUserInfo:
        """
        Fetch verified user identity directly from Google's UserInfo endpoint
        using the OAuth 2.0 access token. This acts as a robust server-to-server
        verification channel resilient against local clock skew and certificate caching issues.
        """
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(GOOGLE_USERINFO_URL, headers=headers)

        if response.status_code != 200:
            logger.error(f"[Google OAuth] Failed to fetch UserInfo with access token: status {response.status_code}")
            raise ValueError(f"Google UserInfo fetch failed with status {response.status_code}")

        data = response.json()
        sub = data.get("sub")
        email = data.get("email")

        if not sub:
            raise ValueError("Google UserInfo response missing required 'sub' claim.")
        if not email:
            raise ValueError("Google UserInfo response missing required 'email' claim.")

        return GoogleUserInfo(
            sub=str(sub),
            email=str(email),
            email_verified=bool(data.get("email_verified", False)),
            name=data.get("name"),
            picture=data.get("picture"),
        )


from fastapi import Depends

def get_google_oauth_service(settings: Settings = Depends(get_settings)) -> GoogleOAuthService:
    return GoogleOAuthService(settings=settings)
