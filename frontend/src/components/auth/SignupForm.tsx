"use client";

import React, { useState } from "react";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  Spinner,
} from "@/components/icons/Icons";
import { GoogleButton } from "./GoogleButton";
import { authService } from "@/services/authService";
import { SignupFormData, FormErrors } from "@/types/auth";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [systemNotice, setSystemNotice] = useState<{
    type: "info" | "warning" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) {
      errs.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errs.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (formData.confirmPassword !== formData.password) {
      errs.confirmPassword = "Passwords do not match.";
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
      const response = await authService.signup(formData);
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
      {/* System Status / Phase 1 Notice Banner */}
      {systemNotice && (
        <div
          role="alert"
          className="p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed"
        >
          {systemNotice.message}
        </div>
      )}

      {/* Continue with Google */}
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
      <div className="relative flex items-center justify-center my-3.5">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-medium text-gray-400 uppercase tracking-widest relative">
          OR
        </span>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Full Name */}
        <div>
          <div className="h-11 rounded-lg border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all bg-white flex items-center px-3.5">
            <UserIcon className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={formData.fullName}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Full name"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "signup-name-error" : undefined}
            />
          </div>
          {errors.fullName && (
            <p id="signup-name-error" role="alert" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="h-11 rounded-lg border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all bg-white flex items-center px-3.5">
            <MailIcon className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
            <input
              id="signup-email"
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
              aria-describedby={errors.email ? "signup-email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="signup-email-error" role="alert" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="h-11 rounded-lg border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all bg-white flex items-center px-3.5">
            <LockIcon className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, password: e.target.value }));
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Password (min. 8 characters)"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "signup-password-error" : undefined}
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
            <p id="signup-password-error" role="alert" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="h-11 rounded-lg border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all bg-white flex items-center px-3.5">
            <LockIcon className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                if (errors.confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Confirm password"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "signup-confirm-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus:outline-none ml-2"
              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
            >
              {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="signup-confirm-error" role="alert" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Create Account Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 rounded-lg bg-[#C84B31] hover:bg-[#B53E26] active:bg-[#A3341E] text-white text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-none focus:outline-none focus:ring-2 focus:ring-[#C84B31]/40"
        >
          {loading ? <Spinner className="w-4 h-4 text-white" /> : "Create Account"}
        </button>
      </form>
    </div>
  );
}
