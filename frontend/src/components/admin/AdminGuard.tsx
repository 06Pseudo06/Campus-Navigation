"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangleIcon, ShieldCheckIcon } from "./AdminIcons";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=%2Fadmin");
    }
  }, [user, loading, router]);

  // Loading State
  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="w-10 h-10 rounded-xl bg-[#E8452C] flex items-center justify-center text-white font-bold text-sm animate-pulse">
          CW
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Verifying Administrative Credentials
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Checking role-based cryptographic access tokens...
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Authenticated but NOT administrator
  if (user.role !== "admin") {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="max-w-md w-full p-8 rounded-2xl border text-center space-y-6 shadow-xl"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertTriangleIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
              Administrative Privileges Required
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Your account (<span className="font-mono font-medium text-foreground">{user.email}</span>) is assigned
              the role <span className="font-mono uppercase font-semibold text-[#E8452C]">{user.role || "student"}</span>.
              The CampusWay Administrative Workspace is restricted to verified campus operators.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/explore"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity"
            >
              Return to Public CampusWay
            </Link>
            <Link
              href="/login?notice=logged_out"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Sign In with Administrator Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Administrator
  return <>{children}</>;
}
