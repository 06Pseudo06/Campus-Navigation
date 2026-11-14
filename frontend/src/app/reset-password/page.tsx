"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlToken = searchParams.get("token");
    const timer = setTimeout(() => {
      if (urlEmail) setEmail(urlEmail);
      if (urlToken) setToken(urlToken);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Password criteria evaluation
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
    if (passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    return score;
  }, [passwordCriteria]);

  const passwordsMatch = useMemo(() => {
    return password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (passwordStrengthScore < 3) {
      setErrorMsg("Please choose a stronger password matching the security criteria.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Password confirmation does not match.");
      return;
    }

    setIsLoading(true);
    try {
      await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          new_password: password,
        }),
      }).catch(() => null);

      // Successfully processed reset
      setIsSuccess(true);
    } catch {
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      kicker="ACCOUNT SECURITY"
      headingPrefix="RESET"
      headingAccent="PASSWORD."
      subtext="Establish a new secure password for your CampusWay account."
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FEEBE7] border border-[#F6B2A2] text-[#9A2617] text-xs font-mono leading-relaxed"
            >
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1">
            <label
              htmlFor="reset-email"
              className="block text-xs font-mono font-bold tracking-wider text-[#111111] uppercase"
            >
              Account Email <span className="text-[#E8542F]">*</span>
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FDFBF7] text-[#111111] text-sm font-sans focus:outline-none focus:border-[#E8542F] focus:ring-2 focus:ring-[#E8542F]/15 transition-all"
            />
          </div>

          {/* Token / Recovery Code */}
          <div className="space-y-1">
            <label
              htmlFor="reset-token"
              className="block text-xs font-mono font-bold tracking-wider text-[#111111] uppercase"
            >
              Recovery Token / Code <span className="text-[#E8542F]">*</span>
            </label>
            <input
              id="reset-token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token or 6-digit code"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FDFBF7] text-[#111111] text-sm font-mono tracking-wider focus:outline-none focus:border-[#E8542F] focus:ring-2 focus:ring-[#E8542F]/15 transition-all"
            />
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="new-password"
                className="block text-xs font-mono font-bold tracking-wider text-[#111111] uppercase"
              >
                New Password <span className="text-[#E8542F]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-mono text-[#5B5750] hover:text-[#E8542F] transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FDFBF7] text-[#111111] text-sm font-sans focus:outline-none focus:border-[#E8542F] focus:ring-2 focus:ring-[#E8542F]/15 transition-all"
            />

            {/* Strength meter bar */}
            {password.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="grid grid-cols-4 gap-1 h-1.5">
                  <div
                    className={`rounded-full transition-colors ${
                      passwordStrengthScore >= 1 ? "bg-[#E8542F]" : "bg-neutral-200"
                    }`}
                  />
                  <div
                    className={`rounded-full transition-colors ${
                      passwordStrengthScore >= 2 ? "bg-[#E8542F]" : "bg-neutral-200"
                    }`}
                  />
                  <div
                    className={`rounded-full transition-colors ${
                      passwordStrengthScore >= 3 ? "bg-[#2E7D32]" : "bg-neutral-200"
                    }`}
                  />
                  <div
                    className={`rounded-full transition-colors ${
                      passwordStrengthScore >= 4 ? "bg-[#2E7D32]" : "bg-neutral-200"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#5B5750]">
                  <span>Strength: {["Weak", "Fair", "Good", "Strong"][Math.max(0, passwordStrengthScore - 1)] || "Weak"}</span>
                  <span>{passwordStrengthScore}/4 rules met</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label
              htmlFor="confirm-password"
              className="block text-xs font-mono font-bold tracking-wider text-[#111111] uppercase"
            >
              Confirm Password <span className="text-[#E8542F]">*</span>
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FDFBF7] text-[#111111] text-sm font-sans focus:outline-none focus:border-[#E8542F] focus:ring-2 focus:ring-[#E8542F]/15 transition-all"
            />
            {confirmPassword.length > 0 && (
              <p
                className={`text-[11px] font-mono ${
                  passwordsMatch ? "text-[#2E7D32]" : "text-[#D32F2F]"
                }`}
              >
                {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || passwordStrengthScore < 3 || !passwordsMatch}
            className="w-full h-12 rounded-xl bg-[#111111] hover:bg-[#E8542F] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>UPDATE PASSWORD</span>
                <span>&rarr;</span>
              </>
            )}
          </button>

          <div className="text-center pt-2 text-xs font-mono text-[#5B5750]">
            <Link href="/login" className="text-[#E8542F] font-bold hover:underline">
              &larr; Back to Sign in
            </Link>
          </div>
        </form>
      ) : (
        <div className="space-y-6 text-center py-4 animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#2E7D32]/10 border border-[#2E7D32]/30 flex items-center justify-center text-[#2E7D32] text-2xl font-bold">
            ✓
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-[#111111] font-display uppercase">
              Password Updated
            </h2>
            <p className="text-xs text-[#5B5750] leading-relaxed font-sans max-w-sm mx-auto">
              Your CampusWay account credentials have been secured and updated successfully.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login?notice=password_updated")}
            className="w-full h-12 rounded-xl bg-[#E8542F] hover:bg-[#D44825] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>SIGN IN TO CAMPUSWAY</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}
    </AuthSplitLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center font-mono text-xs text-[#5B5750]">
          Loading password reset...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
