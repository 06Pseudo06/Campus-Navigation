"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  // Method tab: "email" | "phone"
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Phone OTP state
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpBoxes, setOtpBoxes] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(30);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Safe redirect path (?next=...)
  const [redirectPath, setRedirectPath] = useState("/explore");

  // Validate next redirect to ensure relative paths only (No open redirects!)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get("next");
    if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
      setRedirectPath(nextParam);
    }

    const err = params.get("error");
    const notice = params.get("notice");
    if (err === "google_not_configured") {
      setNoticeMsg("Google OAuth credentials are not configured on the backend yet.");
    } else if (err === "cancelled") {
      setNoticeMsg("Google sign-in was cancelled.");
    } else if (err === "invalid_state") {
      setErrorMsg("Session or security state expired. Please try signing in again.");
    } else if (notice === "logged_out") {
      setNoticeMsg("You have been signed out successfully.");
    } else if (err) {
      setErrorMsg(`Authentication error: ${err}`);
    }
  }, []);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectPath);
    }
  }, [user, authLoading, router, redirectPath]);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, otpCountdown]);

  // Handle Caps Lock warning
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  // Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (response.success) {
        await refreshUser();
        router.push(redirectPath);
      } else {
        // Generic security error message to prevent enumeration
        setErrorMsg(response.message || "Email or password is incorrect.");
      }
    } catch {
      setErrorMsg("Email or password is incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  // Request Phone OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);

    const clean = phone.replace(/\D/g, "");
    if (!clean || clean.length < 7 || clean.length > 15) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestPhoneOtp(countryCode, phone);
      if (res.success) {
        setOtpSent(true);
        setOtpCountdown(30);
        setNoticeMsg(res.message || `Verification passcode sent to ${countryCode} ${phone}`);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        setErrorMsg(res.message || "Failed to dispatch verification code.");
      }
    } catch {
      setErrorMsg("Unable to request verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async () => {
    const code = otpBoxes.join("").trim();
    if (code.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.verifyPhoneOtp(countryCode, phone, code);
      if (res.success) {
        await refreshUser();
        router.push(redirectPath);
      } else {
        setErrorMsg(res.message || "Invalid or expired passcode.");
      }
    } catch {
      setErrorMsg("Passcode verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle individual OTP box typing
  const handleOtpBoxChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newBoxes = [...otpBoxes];
    // Handle paste of 6 digits
    if (val.length > 1) {
      const pasted = val.slice(0, 6).split("");
      pasted.forEach((ch, i) => {
        if (i < 6) newBoxes[i] = ch;
      });
      setOtpBoxes(newBoxes);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newBoxes[index] = val;
    setOtpBoxes(newBoxes);

    // Auto-advance
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpBoxes[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <AuthSplitLayout
      kicker="ACCOUNT / SIGN IN"
      headingPrefix="Welcome"
      headingAccent="back."
      subtext="Sign in to sync your saved campus locations and access custom routes."
      footerNotice={
        <div className="space-y-3">
          <p className="text-xs text-[#5B5750]">
            New to CampusWay?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(redirectPath)}`}
              className="font-bold text-[#E8542F] hover:underline"
            >
              Create an account
            </Link>
          </p>
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-mono text-[#5B5750]/80">
            <Link href="/terms" className="hover:text-[#0E1118]">Terms</Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-[#0E1118]">Privacy</Link>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Google OAuth Button (52px height) */}
        <button
          type="button"
          onClick={() => {
            window.location.href = "/auth/google/login";
          }}
          className="w-full h-[52px] rounded-full border border-[#E1DDD3] bg-white hover:bg-[#F7F5F0] active:scale-98 text-[#0E1118] text-xs font-mono font-bold flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer"
          aria-label="Continue with Google"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider "or" */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E1DDD3]" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C]">or</span>
          <div className="flex-1 h-px bg-[#E1DDD3]" />
        </div>

        {/* Method Sliding Indicator Tabs: Email | Phone */}
        <div className="relative p-1 rounded-full bg-[#F7F5F0] border border-[#E1DDD3] flex items-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab("email");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "email"
                ? "bg-[#0E1118] text-white shadow-xs"
                : "text-[#6B665C] hover:text-[#0E1118]"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("phone");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "phone"
                ? "bg-[#0E1118] text-white shadow-xs"
                : "text-[#6B665C] hover:text-[#0E1118]"
            }`}
          >
            Phone OTP
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-xs font-sans text-rose-800 animate-shake"
          >
            {errorMsg}
          </div>
        )}

        {/* Notice Notification Banner */}
        {noticeMsg && (
          <div
            role="status"
            className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800"
          >
            {noticeMsg}
          </div>
        )}

        {/* EMAIL TAB FORM */}
        {activeTab === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full h-11 px-3.5 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-mono text-[#E8542F] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  onKeyUp={handlePasswordKeyDown}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-3.5 pr-10 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B665C] hover:text-[#0E1118] text-xs font-mono cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {capsLockActive && (
                <p className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⚠ Caps Lock is ON
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#E8542F] accent-[#E8542F] cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-[#5B5750] cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        )}

        {/* PHONE OTP TAB FORM */}
        {activeTab === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                    Mobile Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-11 px-2.5 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-mono font-bold text-[#0E1118] focus-ring-orange"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇨🇦 +1</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>

                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 h-11 px-3.5 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending Code…</span>
                    </>
                  ) : (
                    <span>Send Verification Code &rarr;</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <p className="text-xs text-[#5B5750]">
                    Enter the 6-digit code sent to{" "}
                    <b>{countryCode} {phone}</b>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpBoxes(["", "", "", "", "", ""]);
                    }}
                    className="text-[11px] font-mono text-[#E8542F] hover:underline cursor-pointer"
                  >
                    Wrong number? Edit
                  </button>
                </div>

                {/* 6 OTP Input Boxes */}
                <div className="flex items-center justify-center gap-2">
                  {otpBoxes.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-mono font-bold rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] focus-ring-orange text-[#0E1118]"
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpBoxes.join("").length !== 6}
                  className="w-full h-12 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <span>Verify Passcode &rarr;</span>
                  )}
                </button>

                {/* Resend Cooldown */}
                <div className="text-center text-xs font-mono text-[#5B5750]">
                  {otpCountdown > 0 ? (
                    <span>Resend code in {otpCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-[#E8542F] font-bold hover:underline cursor-pointer"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Secondary Guest Explorer Option (Prominent but secondary) */}
        <div className="pt-2 border-t border-[#E1DDD3] space-y-1.5 text-center">
          <Link
            href="/explore"
            className="w-full py-2.5 px-4 rounded-full border border-[#0E1118]/25 hover:border-[#0E1118] text-[#0E1118] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:bg-[#F7F5F0] cursor-pointer"
          >
            <span>Just looking around? Continue as guest</span>
            <span>&rarr;</span>
          </Link>
          <p className="text-[10px] text-[#5B5750] font-sans">
            No account needed. Your saved places stay on this device.
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
