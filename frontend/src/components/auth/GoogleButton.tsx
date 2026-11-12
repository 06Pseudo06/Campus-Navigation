"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleIcon, Spinner } from "@/components/icons/Icons";

import { authService } from "@/services/authService";

interface GoogleButtonProps {
  text?: string;
  onNotice?: (message: string) => void;
  onSuccess?: () => void;
}

export function GoogleButton({
  text = "Continue with Google",
  onNotice,
  onSuccess,
}: GoogleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Verify backend health
      const health = await authService.checkBackendHealth();
      if (!health.isOnline) {
        setLoading(false);
        if (onNotice) {
          onNotice(
            "FastAPI backend is offline (port 8000). Please ensure the backend is running."
          );
        }
        return;
      }

      // 2. If provider is unconfigured on the backend, verify and display backend contract response
      if (!health.googleConfigured) {
        const probeResult = await authService.loginWithGoogle("probe_token_unconfigured");
        setLoading(false);
        if (onNotice) {
          onNotice(
            probeResult.message ||
              "Google OAuth is not configured on the backend. Client credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) must be set in backend/.env."
          );
        }
        return;
      }

      // 3. When configured, execute token submission to POST /api/v1/auth/google
      // Prompt user or handle Google One-Tap/GIS callback
      const idToken = window.prompt("Enter Google OAuth ID Token for backend verification:");
      if (!idToken || !idToken.trim()) {
        setLoading(false);
        return;
      }

      const result = await authService.loginWithGoogle(idToken.trim());
      setLoading(false);

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/explore?auth=success");
        }
      } else {
        if (onNotice) {
          onNotice(result.message);
        }
      }
    } catch {
      setLoading(false);
      if (onNotice) {
        onNotice("Unable to communicate with the FastAPI backend on port 8000.");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80 active:bg-gray-100 text-gray-800 text-sm font-semibold transition-colors shadow-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300"
      aria-label={text}
    >
      {loading ? (
        <Spinner className="w-4 h-4 text-gray-500" />
      ) : (
        <GoogleIcon className="w-[18px] h-[18px] shrink-0" />
      )}
      <span>{text}</span>
    </button>
  );
}
