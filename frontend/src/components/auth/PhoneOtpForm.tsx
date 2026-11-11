"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PhoneIcon, Spinner, InfoIcon } from "@/components/icons/Icons";
import { authService } from "@/services/authService";
import { CountryCode, FormErrors } from "@/types/auth";

const COUNTRIES: CountryCode[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
];

interface PhoneOtpFormProps {
  onBackToEmail: () => void;
  mode?: "login" | "signup";
}

export function PhoneOtpForm({ onBackToEmail, mode = "login" }: PhoneOtpFormProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<string>("+91");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [systemNotice, setSystemNotice] = useState<{
    type: "info" | "error" | "warning";
    message: string;
  } | null>(null);

  // Resend countdown timer
  const [countdown, setCountdown] = useState<number>(30);
  const canResend = countdown === 0;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const validatePhone = (): boolean => {
    const errs: FormErrors = {};
    const cleanNumber = phoneNumber.trim().replace(/\D/g, "");

    if (!cleanNumber) {
      errs.phoneNumber = "Phone number is required.";
    } else if (selectedCountry === "+91" && cleanNumber.length !== 10) {
      errs.phoneNumber = "Please enter a valid 10-digit Indian mobile number.";
    } else if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      errs.phoneNumber = "Please enter a valid mobile number (7–15 digits).";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateOtp = (): boolean => {
    const errs: FormErrors = {};
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      errs.otp = "Please enter the OTP.";
    } else if (!/^\d{6}$/.test(cleanOtp)) {
      errs.otp = "OTP must be a 6-digit number.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemNotice(null);

    if (!validatePhone()) return;

    setLoading(true);
    try {
      const response = await authService.requestPhoneOtp(
        selectedCountry,
        phoneNumber.trim()
      );

      if (response.success) {
        setSystemNotice({
          type: "info",
          message: response.message,
        });
        setStep("otp");
        setCountdown(30);
      } else {
        setSystemNotice({
          type: "warning",
          message: response.message,
        });
      }
    } catch {
      setSystemNotice({
        type: "error",
        message: "An unexpected error occurred while requesting OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemNotice(null);

    if (!validateOtp()) return;

    setLoading(true);
    try {
      const response = await authService.verifyPhoneOtp(
        selectedCountry,
        phoneNumber.trim(),
        otp.trim()
      );

      if (response.success) {
        setSystemNotice({
          type: "info",
          message: response.message,
        });
        await refreshUser();
        router.push("/explore");
      } else {
        setSystemNotice({
          type: "error",
          message: response.message,
        });
      }
    } catch {
      setSystemNotice({
        type: "error",
        message: "An unexpected error occurred while verifying OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setSystemNotice(null);

    try {
      const response = await authService.requestPhoneOtp(
        selectedCountry,
        phoneNumber.trim()
      );
      if (response.success) {
        setSystemNotice({
          type: "info",
          message: response.message,
        });
        setCountdown(30);
      } else {
        setSystemNotice({
          type: "warning",
          message: response.message,
        });
      }
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
          className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 transition-all ${
            systemNotice.type === "warning"
              ? "bg-amber-50 border border-amber-200 text-amber-900"
              : systemNotice.type === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-900"
              : "bg-blue-50 border border-blue-200 text-blue-900"
          }`}
        >
          <InfoIcon className="w-5 h-5 shrink-0 mt-0.5 text-current opacity-80" />
          <div className="flex-1 font-medium leading-relaxed">
            {systemNotice.message}
          </div>
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
          {/* Mobile input with Country Code Selector */}
          <div>
            <label
              htmlFor="mobile-number"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
            >
              Mobile Number
            </label>
            <div className="flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-[#DE4B31]/40 focus-within:border-[#DE4B31] transition-all bg-white overflow-hidden shadow-xs">
              {/* Country Code Select */}
              <div className="relative border-r border-gray-200 bg-gray-50 flex items-center">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                  aria-label="Country calling code"
                >
                  {COUNTRIES.map((c) => (
                    <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                      {c.flag} {c.dialCode} ({c.name})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Number Input */}
              <div className="relative flex-1 flex items-center">
                <input
                  id="mobile-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                  }}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                  aria-invalid={!!errors.phoneNumber}
                  aria-describedby={errors.phoneNumber ? "phone-error" : undefined}
                />
                <PhoneIcon className="w-4 h-4 text-gray-400 mr-3 pointer-events-none" />
              </div>
            </div>

            {errors.phoneNumber && (
              <p id="phone-error" role="alert" className="mt-1.5 text-xs text-rose-600 font-medium">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 leading-normal">
            We will send a one-time verification code to verify your mobile number.
          </p>

          {/* Request OTP Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#DE4B31] hover:bg-[#C93F27] active:bg-[#B33520] text-white text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DE4B31]/50"
          >
            {loading ? <Spinner className="w-5 h-5 text-white" /> : "Request OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          {/* Verification Code Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="otp-code"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
              >
                Enter 6-Digit OTP
              </label>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-xs text-[#DE4B31] hover:underline font-medium cursor-pointer"
              >
                Change number
              </button>
            </div>

            <div className="relative rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-[#DE4B31]/40 focus-within:border-[#DE4B31] transition-all bg-white shadow-xs">
              <input
                id="otp-code"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setOtp(val);
                  if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
                }}
                placeholder="• • • • • •"
                className="w-full px-3.5 py-2.5 text-center tracking-[0.5em] text-lg font-mono text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                aria-invalid={!!errors.otp}
                aria-describedby={errors.otp ? "otp-error" : undefined}
                autoFocus
              />
            </div>

            {errors.otp && (
              <p id="otp-error" role="alert" className="mt-1.5 text-xs text-rose-600 font-medium text-center">
                {errors.otp}
              </p>
            )}

            {/* Resend Countdown */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Didn&apos;t receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-[#DE4B31] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend OTP
                </button>
              ) : (
                <span className="text-gray-400 font-mono">
                  Resend in {countdown}s
                </span>
              )}
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#DE4B31] hover:bg-[#C93F27] active:bg-[#B33520] text-white text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DE4B31]/50"
          >
            {loading ? <Spinner className="w-5 h-5 text-white" /> : `Verify & ${mode === "signup" ? "Create Account" : "Sign In"}`}
          </button>
        </form>
      )}

      {/* Switch back to Email button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onBackToEmail}
          className="w-full py-2 px-3 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl bg-gray-50/70 hover:bg-gray-100/70 font-medium transition-colors cursor-pointer"
        >
          ← Use Email & Password instead
        </button>
      </div>
    </div>
  );
}
