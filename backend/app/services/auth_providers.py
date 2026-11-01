"""External authentication provider integration interfaces.

Provides clear separation between local authentication (password, JWT) and external
identity providers (Google OAuth, Twilio Phone OTP). External integrations enforce
strict configuration checks, prevent fake success without real providers, and support
test mocks for CI/CD environments.
"""

from typing import Any, Callable, Dict, Optional
import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class GoogleAuthProvider:
    """Google OAuth Identity Integration Interface."""

    def __init__(self) -> None:
        self._mock_verifier: Optional[Callable[[str], Dict[str, Any]]] = None

    def is_configured(self) -> bool:
        """Check if Google OAuth client credentials are configured."""
        return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_ID.strip())

    def set_mock_verifier(self, fn: Optional[Callable[[str], Dict[str, Any]]]) -> None:
        """Set a mock verification callback for test suites."""
        self._mock_verifier = fn

    def verify_id_token(self, id_token: str) -> Dict[str, Any]:
        """Verify Google ID token and return claims (sub, email, name).
        
        Raises HTTPException 503 if provider is not configured.
        Raises HTTPException 401 if token is invalid or rejected by Google.
        """
        if self._mock_verifier:
            return self._mock_verifier(id_token)

        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Google OAuth provider is not configured. "
                    "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env to enable Google sign-in."
                ),
            )

        # Production Google tokeninfo verification
        try:
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token.strip()}"
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url)
            if res.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Google OAuth ID token.",
                )
            data = res.json()
            # Verify audience matches configured client ID
            aud = data.get("aud")
            if aud != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google ID token audience mismatch.",
                )
            return {
                "sub": data.get("sub"),
                "email": data.get("email"),
                "full_name": data.get("name"),
                "email_verified": data.get("email_verified") in (True, "true"),
            }
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to reach Google OAuth verification servers: {str(e)}",
            )


class PhoneOTPProvider:
    """Mobile Phone OTP Verification Interface (Twilio Verify / SMS Gateway)."""

    def __init__(self) -> None:
        self._mock_sender: Optional[Callable[[str], bool]] = None
        self._mock_verifier: Optional[Callable[[str, str], bool]] = None

    def is_configured(self) -> bool:
        """Check if Twilio Verify credentials are configured."""
        return bool(
            settings.TWILIO_ACCOUNT_SID
            and settings.TWILIO_AUTH_TOKEN
            and settings.TWILIO_SERVICE_SID
        )

    def set_mock_handlers(
        self,
        sender: Optional[Callable[[str], bool]] = None,
        verifier: Optional[Callable[[str, str], bool]] = None,
    ) -> None:
        """Set mock sender and verifier callbacks for automated testing."""
        self._mock_sender = sender
        self._mock_verifier = verifier

    def send_otp(self, phone: str) -> bool:
        """Send a one-time verification passcode to the user's mobile number."""
        if self._mock_sender:
            return self._mock_sender(phone)

        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Phone OTP service is not configured. "
                    "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SERVICE_SID in backend/.env."
                ),
            )

        # Real Twilio Verify API integration
        url = f"https://verify.twilio.com/v2/Services/{settings.TWILIO_SERVICE_SID}/Verifications"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(
                    url,
                    data={"To": phone, "Channel": "sms"},
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                )
            if res.status_code not in (200, 201):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"SMS Gateway error: {res.text}",
                )
            return True
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to reach SMS Gateway: {str(e)}",
            )

    def verify_otp(self, phone: str, otp_code: str) -> bool:
        """Verify the passcode entered by the user."""
        if self._mock_verifier:
            return self._mock_verifier(phone, otp_code)

        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Phone OTP service is not configured. "
                    "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SERVICE_SID in backend/.env."
                ),
            )

        url = f"https://verify.twilio.com/v2/Services/{settings.TWILIO_SERVICE_SID}/VerificationCheck"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(
                    url,
                    data={"To": phone, "Code": otp_code},
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                )
            if res.status_code == 200:
                data = res.json()
                return data.get("status") == "approved"
            return False
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to verify passcode with SMS Gateway: {str(e)}",
            )


google_auth_provider = GoogleAuthProvider()
phone_otp_provider = PhoneOTPProvider()
