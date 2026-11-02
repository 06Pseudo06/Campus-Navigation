"use client";

import React, { useState } from "react";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  Spinner,
} from "@/components/icons/Icons";
import { GoogleButton } from "./GoogleButton";
import { authService } from "@/services/authService";
import { LoginFormData, FormErrors } from "@/types/auth";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [systemNotice, setSystemNotice] = useState<{
    type: "info" | "warning" | "error";
    message: string;
  } | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  // If already logged in, redirect to the authenticated explore dashboard
  React.useEffect(() => {
    if (!authLoading && user) {
      router.push("/explore");
    }
  }, [user, authLoading, router]);

  // Inspect URL parameters for OAuth errors and notices
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const notice = params.get("notice");

    queueMicrotask(() => {
      if (err === "session_required") {
        setSystemNotice({
          type: "warning",
          message: "Please sign in to access the campus navigation dashboard.",
        });
      } else if (err === "google_not_configured") {
        setSystemNotice({
          type: "warning",
          message: "Google OAuth credentials have not been configured in backend/.env yet. Please configure your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable live Google sign-in.",
        });
      } else if (err === "cancelled") {
        setSystemNotice({
          type: "info",
          message: "Google sign-in was cancelled.",
        });
      } else if (err === "invalid_state") {
        setSystemNotice({
          type: "error",
          message: "Authentication state mismatch or session expired. Please try signing in again.",
        });
      } else if (err === "token_exchange_failed" || err === "invalid_token") {
        setSystemNotice({
          type: "error",
          message: "Google authentication failed during token verification. Please try again.",
        });
      } else if (notice === "logged_out") {
        setSystemNotice({
          type: "info",
          message: "You have been signed out successfully.",
        });
      } else if (err) {
        setSystemNotice({
          type: "error",
          message: `Authentication error: ${err}`,
        });
      }
    });
  }, []);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errs.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemNotice(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authService.login(formData);
      if (response.success) {
        await refreshUser();
        router.push("/explore");
        return;
      }
      setSystemNotice({
        type: response.isBackendConnected ? "error" : "warning",
        message: response.message,
      });
    } catch {
      setSystemNotice({
        type: "error",
        message: "Unable to reach the backend service.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* System Status / Phase 1 Notice Banner (subtle) */}
      {systemNotice && (
        <div
          role="alert"
          className="p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed"
        >
          {systemNotice.message}
        </div>
      )}

      {/* Continue with Google button */}
      <GoogleButton
        text="Continue with Google"
        onNotice={(msg) =>
          setSystemNotice({
            type: "warning",
            message: msg,
          })
        }
      />

      {/* OR Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-medium text-gray-400 uppercase tracking-widest relative">
          OR
        </span>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Email Address Input */}
        <div>
          <div className="h-11 rounded-lg border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all bg-white flex items-center px-3.5">
            <MailIcon className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="Email address"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <div className="h-11 rounded-lg border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all bg-white flex items-center px-3.5">
            <LockIcon className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, password: e.target.value }));
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Password"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus:outline-none ml-2"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }))
              }
              className="w-4 h-4 rounded border-gray-300 text-[#C84B31] focus:ring-0 cursor-pointer"
            />
            <span className="ml-2 text-xs sm:text-[13px] text-gray-700 font-normal">
              Remember me
            </span>
          </label>

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs sm:text-[13px] text-gray-700 hover:text-gray-900 font-normal cursor-pointer focus:outline-none"
          >
            Forgot password?
          </button>
        </div>

        {/* Warm Terracotta Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 rounded-lg bg-[#C84B31] hover:bg-[#B53E26] active:bg-[#A3341E] text-white text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-none focus:outline-none focus:ring-2 focus:ring-[#C84B31]/40"
        >
          {loading ? <Spinner className="w-4 h-4 text-white" /> : "Sign In"}
        </button>
      </form>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your email to receive recovery instructions.
            </p>

            {forgotNotice && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
                {forgotNotice}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setForgotNotice(
                  "Password reset functionality will be enabled when the FastAPI email backend is connected in Phase 2."
                );
              }}
              className="space-y-3"
            >
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#C84B31]"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotNotice(null);
                  }}
                  className="w-1/2 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-[#C84B31] hover:bg-[#B53E26] rounded-lg"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
