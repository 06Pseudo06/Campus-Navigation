import {
  LoginFormData,
  SignupFormData,
  ApiResponse,
  UserProfile,
} from "@/types/auth";

/**
 * CampusWay Authentication Service
 * 
 * Prepares the frontend for future FastAPI backend integration.
 * In Phase 1, network calls attempt to contact the FastAPI backend URL configured
 * via NEXT_PUBLIC_API_BASE_URL. If the backend is offline or unconfigured,
 * an informative response is returned without fabricating tokens, fake users, or mock sessions.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const DEFAULT_TIMEOUT_MS = 5000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const authService = {
  /**
   * Attempt email/password login against the FastAPI backend
   */
  async login(data: LoginFormData): Promise<ApiResponse> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/login`;

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          remember_me: data.rememberMe,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message:
            errorData?.detail ||
            `Backend returned error (${response.status}): ${response.statusText}`,
          isBackendConnected: true,
        };
      }

      const result = await response.json();
      if (result.access_token && typeof window !== "undefined") {
        localStorage.setItem("campusway_access_token", result.access_token);
      }
      return {
        success: true,
        message: "Login successful.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: `FastAPI backend is not running or unreachable at ${API_BASE_URL}. In Phase 1, form validation is complete, but live authentication requires starting the Phase 2 backend.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Attempt account registration against the FastAPI backend
   */
  async signup(data: SignupFormData): Promise<ApiResponse> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/register`;

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message:
            errorData?.detail ||
            `Backend returned error (${response.status}): ${response.statusText}`,
          isBackendConnected: true,
        };
      }

      const result = await response.json();
      if (result.access_token && typeof window !== "undefined") {
        localStorage.setItem("campusway_access_token", result.access_token);
      }
      return {
        success: true,
        message: "Account created successfully.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: `FastAPI backend is not connected at ${API_BASE_URL}. Frontend registration inputs are validated, but real user creation will be executed once the FastAPI + PostgreSQL backend is deployed in Phase 2.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Request OTP for mobile number authentication via FastAPI /api/v1/auth/phone/send-otp
   */
  async requestPhoneOtp(countryCode: string, phoneNumber: string): Promise<ApiResponse> {
    const cleanedDial = countryCode.trim().startsWith("+") ? countryCode.trim() : `+${countryCode.trim()}`;
    const cleanedNumber = phoneNumber.trim().replace(/\D/g, "");
    const fullPhone = `${cleanedDial}${cleanedNumber}`;
    const endpoint = `${API_BASE_URL}/api/v1/auth/phone/send-otp`;

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          phone: fullPhone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message:
            errorData?.detail ||
            `SMS service error (${response.status}): ${response.statusText}`,
          isBackendConnected: true,
        };
      }

      const result = await response.json().catch(() => null);
      return {
        success: true,
        message: result?.message || `Verification passcode sent successfully to ${fullPhone}.`,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: `FastAPI backend is unreachable at ${API_BASE_URL}. Ensure the backend service is running on port 8000.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Verify entered OTP for mobile number authentication via FastAPI /api/v1/auth/phone/verify-otp
   */
  async verifyPhoneOtp(
    countryCode: string,
    phoneNumber: string,
    otp: string,
    fullName?: string
  ): Promise<ApiResponse> {
    const cleanedDial = countryCode.trim().startsWith("+") ? countryCode.trim() : `+${countryCode.trim()}`;
    const cleanedNumber = phoneNumber.trim().replace(/\D/g, "");
    const fullPhone = `${cleanedDial}${cleanedNumber}`;
    const endpoint = `${API_BASE_URL}/api/v1/auth/phone/verify-otp`;

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          phone: fullPhone,
          otp_code: otp.trim(),
          full_name: fullName?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message:
            errorData?.detail ||
            `OTP verification failed (${response.status}): ${response.statusText}`,
          isBackendConnected: true,
        };
      }

      const result = await response.json();
      if (result.access_token && typeof window !== "undefined") {
        localStorage.setItem("campusway_access_token", result.access_token);
      }
      return {
        success: true,
        message: "Phone number verified and session established.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: `FastAPI backend is unreachable at ${API_BASE_URL}. Ensure the backend service is running on port 8000.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Authenticate or register user via Google OAuth ID Token: POST /api/v1/auth/google
   */
  async loginWithGoogle(idToken: string): Promise<ApiResponse> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/google`;

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id_token: idToken.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message:
            errorData?.detail ||
            `Google authentication failed (${response.status}): ${response.statusText}`,
          isBackendConnected: true,
        };
      }

      const result = await response.json();
      if (result.access_token && typeof window !== "undefined") {
        localStorage.setItem("campusway_access_token", result.access_token);
      }
      return {
        success: true,
        message: "Google sign-in successful.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: `FastAPI backend is unreachable at ${API_BASE_URL}. Ensure the backend service is running on port 8000.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Quick health check to ensure backend is accessible before navigating
   */
  async checkBackendHealth(): Promise<{ isOnline: boolean; googleConfigured: boolean; message?: string }> {
    const endpoint = `${API_BASE_URL}/health`;
    try {
      const response = await fetchWithTimeout(endpoint, { method: "GET" }, 2500);
      if (!response.ok) {
        return { isOnline: false, googleConfigured: false, message: `Backend returned HTTP ${response.status}` };
      }
      const data = await response.json().catch(() => ({}));
      return {
        isOnline: true,
        googleConfigured: Boolean(data.google_auth_configured),
      };
    } catch {
      return { isOnline: false, googleConfigured: false, message: "Connection refused" };
    }
  },

  /**
   * Note on Google OAuth:
   * The active backend contract is POST /api/v1/auth/google with a client-supplied ID Token.
   */
  getGoogleLoginUrl(): string {
    return `${API_BASE_URL}/api/v1/auth/google`;
  },

  /**
   * Fetch currently authenticated user session via /api/v1/auth/me.
   * Transmits Bearer token in the Authorization header.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/me`;
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("campusway_access_token")
          : null;
      if (!token) {
        return null;
      }

      const headers: Record<string, string> = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetchWithTimeout(endpoint, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("campusway_access_token");
        }
        return null;
      }

      const user = await response.json();
      return {
        ...user,
        name: user.full_name || user.name || (user.email ? user.email.split("@")[0] : "Student"),
      };
    } catch {
      return null;
    }
  },

  /**
   * Terminate active backend session and clear local access token.
   */
  async logout(): Promise<boolean> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/logout`;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("campusway_access_token")
        : null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("campusway_access_token");
    }

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
