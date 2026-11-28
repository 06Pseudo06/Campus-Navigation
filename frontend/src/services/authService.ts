import {
  LoginFormData,
  SignupFormData,
  ApiResponse,
  UserProfile,
  ProfileUpdateData,
  ChangePasswordData,
  DeleteAccountData,
} from "@/types/auth";
import {
  getApiBaseUrl,
  getBackendErrorMessage,
  isProduction,
} from "@/lib/apiConfig";

/**
 * CampusWay Authentication Service
 * 
 * Provides environment-aware connectivity to the FastAPI backend.
 * In development, provides informative guidance on port 8000.
 * In production, connects to the verified Render production backend,
 * accounting for cloud cold-start latency and proxy rewrites.
 */

function getApiEndpoint(path: string): string {
  const base = getApiBaseUrl({ preferRelative: true });
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

const DEFAULT_TIMEOUT_MS = 25000;

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
    const endpoint = getApiEndpoint("/api/v1/auth/login");

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
      return {
        success: true,
        message: "Login successful.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: isProduction()
          ? "Unable to reach the backend service. It may be waking up from sleep. Please try again in a few moments."
          : `FastAPI backend is not running or unreachable at ${getApiBaseUrl()}. In Phase 1, form validation is complete, but live authentication requires starting the Phase 2 backend.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Attempt account registration against the FastAPI backend
   */
  async signup(data: SignupFormData): Promise<ApiResponse> {
    const endpoint = getApiEndpoint("/api/v1/auth/register");

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
      return {
        success: true,
        message: "Account created successfully.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: isProduction()
          ? "Unable to reach the backend service. It may be waking up from sleep. Please try again in a few moments."
          : `FastAPI backend is not connected at ${getApiBaseUrl()}. Frontend registration inputs are validated, but real user creation will be executed once the FastAPI + PostgreSQL backend is deployed in Phase 2.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Request OTP for mobile number authentication
   */
  async requestPhoneOtp(countryCode: string, phoneNumber: string): Promise<ApiResponse> {
    const endpoint = getApiEndpoint("/api/v1/auth/otp/send");

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          country_code: countryCode,
          phone_number: phoneNumber,
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

      return {
        success: true,
        message: "OTP sent successfully to your phone.",
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: isProduction()
          ? "SMS authentication service is temporarily unavailable. Please try again later."
          : `SMS gateway is not configured yet. Live OTP delivery will be connected to the SMS service provider via FastAPI in Phase 2.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Verify entered OTP for mobile number authentication
   */
  async verifyPhoneOtp(
    countryCode: string,
    phoneNumber: string,
    otp: string
  ): Promise<ApiResponse> {
    const endpoint = getApiEndpoint("/api/v1/auth/otp/verify");

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          country_code: countryCode,
          phone_number: phoneNumber,
          otp,
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
      return {
        success: true,
        message: "Phone number verified.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: isProduction()
          ? "SMS verification service is temporarily unavailable. Please try again later."
          : `SMS authentication service is not connected to a live backend. Real verification requires the Phase 2 FastAPI backend and SMS gateway.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Health check to ensure backend is accessible before navigating or initiating OAuth.
   * Handles Render cold starts gracefully with extended timeout (10s) and progressive status callback.
   * Also attempts fallback to Next.js relative proxy if direct cross-origin fetch is blocked.
   */
  async checkBackendHealth(
    onProgress?: (status: { isWakingUp: boolean; message: string }) => void
  ): Promise<{ isOnline: boolean; googleConfigured: boolean; isWakingUp?: boolean; message?: string }> {
    const primaryUrl = getApiEndpoint("/api/v1/health");

    let coldStartTimer: NodeJS.Timeout | null = null;
    let coldStartNotified = false;
    if (onProgress) {
      coldStartTimer = setTimeout(() => {
        coldStartNotified = true;
        onProgress({
          isWakingUp: true,
          message: isProduction()
            ? "Connecting to backend service (waking up cloud instance)..."
            : "Connecting to local FastAPI backend on port 8000...",
        });
      }, 2500);
    }

    try {
      const response = await fetchWithTimeout(primaryUrl, { method: "GET" }, 25000);
      if (coldStartTimer) clearTimeout(coldStartTimer);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          isOnline: true,
          googleConfigured: Boolean(data.google_auth_configured),
        };
      }

      return {
        isOnline: false,
        googleConfigured: false,
        isWakingUp: response.status === 502 || response.status === 503,
        message: getBackendErrorMessage("offline", `Backend returned HTTP ${response.status}`),
      };
    } catch {
      if (coldStartTimer) clearTimeout(coldStartTimer);

      // Second attempt (if in browser and primaryUrl was relative, try direct Render backend):
      if (typeof window !== "undefined" && primaryUrl.startsWith("/")) {
        try {
          const directUrl = `${getApiBaseUrl()}/api/v1/health`;
          const directResponse = await fetchWithTimeout(directUrl, { method: "GET" }, 15000);
          if (directResponse.ok) {
            const data = await directResponse.json().catch(() => ({}));
            return {
              isOnline: true,
              googleConfigured: Boolean(data.google_auth_configured),
            };
          }
        } catch {
          // Both proxied and direct health checks failed
        }
      }

      return {
        isOnline: false,
        googleConfigured: false,
        isWakingUp: coldStartNotified,
        message: getBackendErrorMessage(coldStartNotified ? "waking_up" : "offline"),
      };
    }
  },

  /**
   * Get FastAPI Google OAuth authorization initiation URL.
   * Directs browser to FastAPI endpoint which validates state and forwards to Google.
   */
  getGoogleLoginUrl(): string {
    return `${getApiBaseUrl()}/api/v1/auth/google/login`;
  },

  /**
   * Fetch currently authenticated user session via /api/v1/auth/me.
   * Transmits credentials (HTTP-only session cookie) to backend.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const endpoint = getApiEndpoint("/api/v1/auth/me");
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const user: UserProfile = await response.json();
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Update authenticated user profile name.
   */
  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<UserProfile>> {
    const endpoint = getApiEndpoint("/api/v1/auth/profile");
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: data.name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message: errorData?.detail || `Profile update failed (${response.status}).`,
          isBackendConnected: true,
        };
      }

      const user: UserProfile = await response.json();
      return {
        success: true,
        message: "Profile updated successfully.",
        data: user,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: isProduction()
          ? "Unable to connect to the backend service. Please check your connection and retry."
          : `FastAPI backend is unreachable at ${getApiBaseUrl()}.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Change password for email-authenticated user.
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    const endpoint = getApiEndpoint("/api/v1/auth/change-password");
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
          confirm_password: data.confirmPassword || data.newPassword,
        }),
      });

      const resData = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          success: false,
          message: resData?.detail || `Password change failed (${response.status}).`,
          isBackendConnected: true,
        };
      }

      return {
        success: true,
        message: resData?.message || "Password changed successfully.",
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: isProduction()
          ? "Unable to connect to the backend service. Please check your connection and retry."
          : `FastAPI backend is unreachable at ${getApiBaseUrl()}.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Permanently delete user account.
   */
  async deleteAccount(data: DeleteAccountData): Promise<ApiResponse> {
    const endpoint = getApiEndpoint("/api/v1/auth/account");
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          confirm_text: data.confirmText,
          password: data.password || null,
        }),
      });

      const resData = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          success: false,
          message: resData?.detail || `Account deletion failed (${response.status}).`,
          isBackendConnected: true,
        };
      }

      return {
        success: true,
        message: resData?.message || "Your account has been permanently deleted.",
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: isProduction()
          ? "Unable to connect to the backend service. Please check your connection and retry."
          : `FastAPI backend is unreachable at ${getApiBaseUrl()}.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Terminate active backend session and clear session cookie.
   */
  async logout(): Promise<boolean> {
    const endpoint = getApiEndpoint("/api/v1/auth/logout");
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
