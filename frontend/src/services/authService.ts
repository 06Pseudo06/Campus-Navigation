import {
  LoginFormData,
  SignupFormData,
  ApiResponse,
  UserProfile,
  ProfileUpdateData,
  ChangePasswordData,
  DeleteAccountData,
} from "@/types/auth";

/**
 * CampusWay Authentication Service
 * 
 * Handles authentication, user profile management, security settings,
 * and account deletion against the FastAPI backend.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const DEFAULT_TIMEOUT_MS = 10000;

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
      return {
        success: true,
        message: "Login successful.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: `FastAPI backend is not running or unreachable at ${API_BASE_URL}.`,
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
      return {
        success: true,
        message: "Account created successfully.",
        data: result,
        isBackendConnected: true,
      };
    } catch {
      return {
        success: false,
        message: `FastAPI backend is not connected at ${API_BASE_URL}.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Request OTP for mobile number authentication
   */
  async requestPhoneOtp(countryCode: string, phoneNumber: string): Promise<ApiResponse> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/otp/send`;

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
        message: `SMS gateway is not configured yet.`,
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
    const endpoint = `${API_BASE_URL}/api/v1/auth/otp/verify`;

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
        message: `SMS authentication service is not connected to a live backend.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Quick health check to ensure backend is accessible before navigating
   */
  async checkBackendHealth(): Promise<{ isOnline: boolean; googleConfigured: boolean; message?: string }> {
    const endpoint = `${API_BASE_URL}/api/v1/health`;
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
   * Get FastAPI Google OAuth authorization initiation URL.
   */
  getGoogleLoginUrl(): string {
    return `${API_BASE_URL}/api/v1/auth/google/login`;
  },

  /**
   * Fetch currently authenticated user session via /api/v1/auth/me.
   * Transmits credentials (HTTP-only session cookie) to backend.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/me`;
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
    const endpoint = `${API_BASE_URL}/api/v1/auth/profile`;
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ full_name: data.name }),
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
        message: `FastAPI backend is unreachable at ${API_BASE_URL}.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Change password for email-authenticated user.
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/change-password`;
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
        message: `FastAPI backend is unreachable at ${API_BASE_URL}.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Permanently delete user account.
   */
  async deleteAccount(data: DeleteAccountData): Promise<ApiResponse> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/account`;
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
          current_password: data.password || null,
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
        message: `FastAPI backend is unreachable at ${API_BASE_URL}.`,
        isBackendConnected: false,
      };
    }
  },

  /**
   * Terminate active backend session and clear session cookie.
   */
  async logout(): Promise<boolean> {
    const endpoint = `${API_BASE_URL}/api/v1/auth/logout`;
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
