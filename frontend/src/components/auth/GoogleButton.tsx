"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleIcon, Spinner } from "@/components/icons/Icons";
import { authService } from "@/services/authService";
import { auth, googleProvider, signInWithPopup } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

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
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Execute Firebase Google Sign-In Popup
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      // 2. Transmit verified Firebase ID token to FastAPI backend
      const result = await authService.loginWithFirebase(idToken);
      setLoading(false);

      if (result.success) {
        await refreshUser();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/explore?auth=success");
        }
      } else {
        if (onNotice) {
          onNotice(result.message || "Failed to authenticate session with backend.");
        }
      }
    } catch (err: unknown) {
      setLoading(false);
      const error = err as { code?: string; message?: string };
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        return;
      }
      if (onNotice) {
        onNotice(error?.message || "Google sign-in could not be completed.");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80 active:bg-gray-100 text-gray-800 text-sm font-semibold transition-colors shadow-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-60"
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
