"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { CARLETON_DEMO_LOCATIONS } from "@/data/carletonLocations";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  // Wizard Steps: 1 = Details, 2 = Verify Email, 3 = Welcome & Home Building
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 2: Verification Code
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Step 3: Welcome & Home Building
  const [homeBuilding, setHomeBuilding] = useState("ML");

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password strength evaluation
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  }, [password]);

  const passwordStrengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLength) score += 1;
    if (passwordCriteria.hasUpper && passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (password.length >= 12) score += 1;
    return score;
  }, [passwordCriteria, password.length]);

  // Resend timer for Step 2
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 2 && resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [currentStep, resendCooldown]);

  // Handle Step 1 Submit
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.signup({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (response.success) {
        // Transition to Step 2 (Verification)
        setCurrentStep(2);
        setResendCooldown(30);
      } else {
        setErrorMsg(response.message || "An account with this email address already exists.");
      }
    } catch {
      setErrorMsg("Registration failed. Please verify your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2 Verification Submit
  const handleStep2Verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Refresh user session after verification
      await refreshUser();
      setCurrentStep(3);
    } catch {
      setErrorMsg("Verification code error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Complete Welcome and navigate to Explore
  const handleCompleteRegistration = async () => {
    if (homeBuilding && typeof window !== "undefined") {
      localStorage.setItem("campusway_home_building", homeBuilding);
    }
    await refreshUser();
    router.push("/explore?auth=welcome");
  };

  return (
    <AuthSplitLayout
      kicker={`ACCOUNT / STEP 0${currentStep}`}
      headingPrefix={currentStep === 1 ? "Create your" : currentStep === 2 ? "Verify your" : "You're"}
      headingAccent={currentStep === 1 ? "account." : currentStep === 2 ? "inbox." : "in."}
      subtext={
        currentStep === 1
          ? "Join CampusWay to bookmark locations, plan custom corridors and access verified routes."
          : currentStep === 2
          ? `We sent a 6-digit confirmation code to ${email}.`
          : `Welcome to CampusWay, ${fullName || "Student"}. Your campus is ready to explore.`
      }
      footerNotice={
        currentStep === 1 ? (
          <p className="text-xs text-[#5B5750]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#E8542F] hover:underline">
              Sign in
            </Link>
          </p>
        ) : undefined
      }
    >
      {/* STEP 1: REGISTRATION DETAILS */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/auth/google/login";
            }}
            className="w-full h-[52px] rounded-full border border-[#E1DDD3] bg-white hover:bg-[#F7F5F0] active:scale-98 text-[#0E1118] text-xs font-mono font-bold flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer"
            aria-label="Sign up with Google"
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

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-xs font-sans text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleStep1Submit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full h-11 px-3.5 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@university.edu"
                className="w-full h-11 px-3.5 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
              />
            </div>

            {/* Password with Strength Meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-mono text-[#6B665C] hover:text-[#0E1118] cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full h-11 px-3.5 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
              />

              {/* 4-Segment Strength Bar */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`rounded-full transition-colors ${
                          passwordStrengthScore >= seg
                            ? passwordStrengthScore === 1
                              ? "bg-rose-500"
                              : passwordStrengthScore === 2
                              ? "bg-amber-500"
                              : passwordStrengthScore === 3
                              ? "bg-emerald-500"
                              : "bg-emerald-600"
                            : "bg-[#E1DDD3]"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Checklist Rules */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#6B665C] pt-0.5">
                    <span className={passwordCriteria.minLength ? "text-emerald-700 font-bold" : ""}>
                      {passwordCriteria.minLength ? "✓" : "○"} 8+ characters
                    </span>
                    <span className={passwordCriteria.hasUpper && passwordCriteria.hasLower ? "text-emerald-700 font-bold" : ""}>
                      {passwordCriteria.hasUpper && passwordCriteria.hasLower ? "✓" : "○"} Upper &amp; lower
                    </span>
                    <span className={passwordCriteria.hasNumber ? "text-emerald-700 font-bold" : ""}>
                      {passwordCriteria.hasNumber ? "✓" : "○"} Number (0-9)
                    </span>
                    <span className={password.length >= 12 ? "text-emerald-700 font-bold" : ""}>
                      {password.length >= 12 ? "✓" : "○"} 12+ recommended
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Role and Phone */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                  I am a
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="staff">Staff</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0199"
                  className="w-full h-11 px-3 rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] text-xs font-sans text-[#0E1118] focus-ring-orange"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="terms"
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#E8542F] accent-[#E8542F] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-[#5B5750] leading-tight select-none">
                I agree to the{" "}
                <Link href="/terms" className="underline hover:text-[#0E1118]">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-[#0E1118]">Privacy Policy</Link>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Creating Account…</span>
                </>
              ) : (
                <span>Create account &rarr;</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: VERIFY EMAIL */}
      {currentStep === 2 && (
        <form onSubmit={handleStep2Verify} className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-[16px] bg-[#F7F5F0] border border-[#E1DDD3] text-center space-y-1">
            <span className="text-2xl">📬</span>
            <p className="text-xs text-[#0E1118] font-bold">Check your inbox</p>
            <p className="text-[11px] text-[#5B5750]">
              We sent a 6-digit confirmation code to <b>{email}</b>.
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* 6 Digit Code Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block text-center">
              Enter 6-Digit Passcode
            </label>
            <div className="flex items-center justify-center gap-2">
              {verifyCode.map((ch, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={ch}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const updated = [...verifyCode];
                    updated[idx] = val;
                    setVerifyCode(updated);
                    if (val && idx < 5) {
                      const next = document.getElementById(`signup-otp-${idx + 1}`);
                      next?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !verifyCode[idx] && idx > 0) {
                      const prev = document.getElementById(`signup-otp-${idx - 1}`);
                      prev?.focus();
                    }
                  }}
                  id={`signup-otp-${idx}`}
                  className="w-11 h-12 text-center text-lg font-mono font-bold rounded-[12px] bg-[#F7F5F0] border border-[#E1DDD3] focus-ring-orange text-[#0E1118]"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Verifying…</span>
            ) : (
              <span>Confirm &amp; Continue &rarr;</span>
            )}
          </button>

          <div className="flex items-center justify-between text-xs font-mono text-[#5B5750] pt-1">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="hover:text-[#0E1118] underline cursor-pointer"
            >
              Use a different email
            </button>

            {resendCooldown > 0 ? (
              <span>Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={() => setResendCooldown(30)}
                className="text-[#E8542F] font-bold hover:underline cursor-pointer"
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      )}

      {/* STEP 3: WELCOME & SET HOME BUILDING */}
      {currentStep === 3 && (
        <div className="space-y-6 text-center animate-fadeIn">
          {/* Animated Drawn Check Mark */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-3xl font-bold shadow-sm">
            ✓
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#0E1118]">
              Account verified!
            </h3>
            <p className="text-xs text-[#5B5750] max-w-sm mx-auto">
              Your CampusWay account is live. Set your home building to optimize default routing start points.
            </p>
          </div>

          {/* Set Home Building Selector */}
          <div className="p-4 rounded-[16px] bg-[#F7F5F0] border border-[#E1DDD3] text-left space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#6B665C] block">
              Set your Home Building (Optional)
            </label>
            <select
              value={homeBuilding}
              onChange={(e) => setHomeBuilding(e.target.value)}
              className="w-full h-11 px-3 rounded-[12px] bg-white border border-[#E1DDD3] text-xs font-sans font-semibold text-[#0E1118] focus-ring-orange cursor-pointer"
            >
              {CARLETON_DEMO_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.code || loc.id}>
                  {loc.code ? `[${loc.code}] ` : ""}
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCompleteRegistration}
            className="w-full h-12 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Go to the Map &rarr;</span>
          </button>
        </div>
      )}
    </AuthSplitLayout>
  );
}
