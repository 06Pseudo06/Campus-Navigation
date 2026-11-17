"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { CampusWayLogo } from "@/components/icons/Icons";
import { ThemeSegmentedControl, ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, refreshUser } = useAuth();

  // Personal info state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Account deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Format timestamp helper
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Helper for user initials
  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "CW";
  };

  // Copy Account ID to clipboard
  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Start editing profile name
  const handleStartEditName = () => {
    setNameInput(user?.name || (user?.email ? user.email.split("@")[0] : ""));
    setIsEditingName(true);
    setProfileMessage(null);
  };

  // Cancel profile name editing
  const handleCancelEditName = () => {
    setNameInput(user?.name || (user?.email ? user.email.split("@")[0] : ""));
    setIsEditingName(false);
    setProfileMessage(null);
  };

  // Save profile full name
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setProfileMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);

    const res = await authService.updateProfile({ name: nameInput.trim() });
    setIsSavingProfile(false);

    if (res.success) {
      setProfileMessage({ type: "success", text: "Display name updated successfully." });
      setIsEditingName(false);
      await refreshUser();
      setTimeout(() => setProfileMessage(null), 4000);
    } else {
      setProfileMessage({ type: "error", text: res.message });
    }
  };

  // Submit password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password cannot be identical to current password.",
      });
      return;
    }

    setIsChangingPassword(true);
    const res = await authService.changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordMessage({ type: "success", text: res.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 5000);
    } else {
      setPasswordMessage({ type: "error", text: res.message });
    }
  };

  // Submit account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteErrorMessage("Please type DELETE exactly to confirm.");
      return;
    }
    if (user?.has_password && !deletePassword) {
      setDeleteErrorMessage("Please enter your current password to confirm deletion.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteErrorMessage(null);

    const res = await authService.deleteAccount({
      confirmText: deleteConfirmText,
      password: deletePassword || undefined,
    });

    setIsDeletingAccount(false);

    if (res.success) {
      setIsDeleteModalOpen(false);
      router.push("/?notice=account_deleted");
    } else {
      setDeleteErrorMessage(res.message);
    }
  };

  // Unauthenticated or Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#070b14] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="mt-4 text-sm text-slate-500 dark:text-zinc-400">Loading your profile &amp; settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#070b14] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-sm">
          <CampusWayLogo className="w-8 h-8 text-[#DE4B31]" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Authentication Required</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
          You must be signed in with an active session to view your profile and account settings.
        </p>
        <Link
          href="/login?redirect=/profile"
          className="px-6 py-2.5 rounded-xl bg-[#DE4B31] hover:bg-[#c93f27] text-white text-sm font-semibold transition-colors shadow-lg shadow-[#DE4B31]/20 cursor-pointer"
        >
          Sign In to CampusWay
        </Link>
      </div>
    );
  }

  const isGoogleAccount = user.auth_provider === "google" && !user.has_password;

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#070b14] text-[#172033] dark:text-zinc-100 selection:bg-[#DE4B31]/30 transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#0d1322]/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-slate-900 dark:text-white hover:opacity-90 transition-opacity"
            >
              <CampusWayLogo className="w-6 h-6 text-[#DE4B31]" />
              <span className="text-lg font-bold tracking-tight">CampusWay</span>
            </Link>
            <span className="text-slate-300 dark:text-zinc-600">/</span>
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Profile &amp; Settings</span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 transition-colors"
            >
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Campus Map</span>
            </Link>

            <button
              onClick={() => logout()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-600 dark:text-rose-300 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* A. Profile Header Card */}
        <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#111827] dark:to-[#0c121e] border border-slate-200 dark:border-zinc-800/90 p-6 sm:p-8 shadow-sm dark:shadow-2xl transition-colors">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-[#DE4B31]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* User Avatar */}
            <div className="relative shrink-0">
              {user.picture ? (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-slate-100 dark:ring-zinc-800/80 shadow-md bg-slate-100 dark:bg-zinc-800">
                  <Image
                    src={user.picture}
                    alt={user.name || "User Avatar"}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#DE4B31] via-orange-600 to-amber-600 ring-4 ring-slate-100 dark:ring-zinc-800/80 shadow-md flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold tracking-wider">
                  {getInitials(user.name, user.email)}
                </div>
              )}
              {user.email_verified && (
                <div
                  title="Verified Account"
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 text-white dark:text-zinc-950 flex items-center justify-center ring-4 ring-white dark:ring-[#111827] shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Profile Overview Details */}
            <div className="flex-1 text-center sm:text-left space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {user.name || "CampusWay Member"}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-mono mt-0.5">{user.email}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                  {/* Auth Provider Badge */}
                  {user.auth_provider === "google" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/60 text-xs font-medium text-blue-700 dark:text-blue-300">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                        />
                      </svg>
                      <span>Google OAuth 2.0</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 text-xs font-medium text-amber-800 dark:text-amber-300">
                      <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Email &amp; Password</span>
                    </span>
                  )}

                  {/* Verified Session Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/60 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Active Session</span>
                  </span>

                  {/* Role Badge */}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 capitalize">
                    {user.role || "Student"}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Manage your personal profile details, customize appearance preferences, inspect connected session credentials, and configure account security settings.
              </p>
            </div>
          </div>
        </section>

        {/* B. Appearance & Theme Card */}
        <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl transition-colors">
          <div className="border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#DE4B31]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
                <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
                <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
                <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
              </svg>
              <span>Appearance &amp; Theme</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Customize your viewing experience with Dark Mode, Light Mode, or automatic System Default syncing.
            </p>
          </div>

          <ThemeSegmentedControl />
        </section>

        {/* C. Personal Information Card */}
        <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-[#DE4B31]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Personal Information</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Update your primary profile display name and view account identifiers.
              </p>
            </div>

            {!isEditingName && (
              <button
                type="button"
                onClick={handleStartEditName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors border border-slate-200 dark:border-zinc-700 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Name</span>
              </button>
            )}
          </div>

          {/* Feedback message banner */}
          {profileMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all ${
                profileMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/60 text-rose-800 dark:text-rose-300"
              }`}
            >
              {profileMessage.type === "success" ? (
                <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Full Name
              </label>
              {isEditingName ? (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={isSavingProfile}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#DE4B31] focus:border-transparent transition"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-4 py-2 rounded-xl bg-[#DE4B31] hover:bg-[#c93f27] text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditName}
                      disabled={isSavingProfile}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-sm text-slate-800 dark:text-zinc-100 font-medium">
                  {user.name || "Anonymous Member"}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  Email Address
                </label>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Read-only
                </span>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 text-sm text-slate-500 dark:text-zinc-400 font-mono flex items-center justify-between">
                <span>{user.email}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-sans">Primary</span>
              </div>
            </div>

            {/* Account ID */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Account ID (Neon PostgreSQL UUID)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-mono truncate select-all">
                  {user.id}
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedId ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-slate-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Created At & Last Login */}
            <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/60">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-medium">Member Registration</span>
              <span className="text-xs text-slate-700 dark:text-zinc-200 font-mono">{formatDate(user.created_at)}</span>
            </div>

            <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/60">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-medium">Last Authenticated</span>
              <span className="text-xs text-slate-700 dark:text-zinc-200 font-mono">{formatDate(user.last_login_at)}</span>
            </div>
          </div>
        </section>

        {/* D. Security Settings Card */}
        <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl transition-colors">
          <div className="border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Security &amp; Authentication</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Review credential providers, manage password authentication, and inspect active database sessions.
            </p>
          </div>

          {/* Conditional Password Management */}
          {isGoogleAccount ? (
            <div className="rounded-2xl bg-blue-50/60 dark:bg-gradient-to-r dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/40 p-5 space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/60 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Google Single Sign-On (SSO) Active
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Your account is securely linked to Google OAuth 2.0. Password changes, multi-factor authentication, and account recovery are handled directly by Google Identity Services.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <span>Manage Google Account Security</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Change Account Password</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Password changes require your current password and will be securely hashed with Argon2id.
                </p>
              </div>

              {/* Password feedback alert */}
              {passwordMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/60 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isChangingPassword}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#DE4B31] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      disabled={isChangingPassword}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#DE4B31] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      disabled={isChangingPassword}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#DE4B31] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#DE4B31] hover:bg-[#c93f27] text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Session Information Block */}
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800/80 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Active Database Session</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Your browser authenticates via a cryptographically signed HTTP-only cookie validated against Neon PostgreSQL.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 space-y-1">
                <span className="text-slate-500 dark:text-zinc-500 font-medium block">Session Identifier</span>
                <span className="font-mono text-slate-800 dark:text-zinc-300 truncate block">
                  {user.session_id || "Active (Database Revocable)"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 space-y-1">
                <span className="text-slate-500 dark:text-zinc-500 font-medium block">Cookie Protection</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium block">
                  HttpOnly • SameSite=Lax
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 space-y-1">
                <span className="text-slate-500 dark:text-zinc-500 font-medium block">Session Expiration</span>
                <span className="font-mono text-slate-800 dark:text-zinc-300 block">
                  {user.session_expires_at ? formatDate(user.session_expires_at) : "Active (Persistent)"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700 transition flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Terminate Current Session (Sign Out)</span>
              </button>
            </div>
          </div>
        </section>

        {/* E. Danger Zone Card */}
        <section className="rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-6 sm:p-8 space-y-4 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Danger Zone</span>
              </h2>
              <p className="text-xs text-rose-800/80 dark:text-rose-200/70 max-w-xl leading-relaxed">
                Permanently delete your CampusWay account, authentication records, saved navigation routes, and database sessions. This operation is immediate and irreversible.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText("");
                setDeletePassword("");
                setDeleteErrorMessage(null);
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-md shadow-rose-900/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete My Account</span>
            </button>
          </div>
        </section>
      </main>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-rose-300 dark:border-rose-800/80 shadow-2xl p-6 sm:p-7 space-y-5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 border border-rose-200 dark:border-rose-700/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                This will immediately purge your user profile, active sessions, saved routes, and preferences from PostgreSQL. You cannot undo this action.
              </p>
            </div>

            {deleteErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-xs text-rose-800 dark:text-rose-200">
                {deleteErrorMessage}
              </div>
            )}

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Type <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeletingAccount}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              {user.has_password && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Enter your current password:
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isDeletingAccount}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showDeletePassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  isDeletingAccount ||
                  deleteConfirmText !== "DELETE" ||
                  (Boolean(user.has_password) && !deletePassword)
                }
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md shadow-rose-900/30"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
