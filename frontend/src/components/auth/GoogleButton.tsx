"use client";

import React, { useState } from "react";
import { GoogleIcon, Spinner } from "@/components/icons/Icons";

import { authService } from "@/services/authService";

interface GoogleButtonProps {
  text?: string;
  onNotice?: (message: string) => void;
}

export function GoogleButton({
  text = "Continue with Google",
  onNotice,
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Verify that FastAPI backend is reachable to avoid ERR_CONNECTION_REFUSED
      const health = await authService.checkBackendHealth();
      if (!health.isOnline) {
        setLoading(false);
        if (onNotice) {
          onNotice(
            "FastAPI backend is offline (port 8000). Please run 'npm run dev' in your project root to run both backend and frontend."
          );
        }
        return;
      }

      if (!health.googleConfigured) {
        setLoading(false);
        if (onNotice) {
          onNotice(
            "Google OAuth is not configured in backend/.env. Please verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
          );
        }
        return;
      }

      // 2. Redirect browser to FastAPI Google OAuth initiation endpoint
      const loginUrl = authService.getGoogleLoginUrl();
      window.location.href = loginUrl;
    } catch {
      setLoading(false);
      if (onNotice) {
        onNotice("Unable to communicate with the backend on port 8000.");
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
