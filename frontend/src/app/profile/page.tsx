"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { CampusWayLogo } from "@/components/icons/Icons";
import { ThemeSegmentedControl, ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  CompassIcon,
  WalkingIcon,
  AccessibilityIcon,
  BookmarkIcon,
  RouteIcon,
  CheckCircleIcon,
  SignOutIcon,
  SettingsIcon,
  QrCodeIcon,
} from "@/components/dashboard/DashboardIcons";
import { MapLayerMode } from "@/types/campus";
import { VERIFIED_DATASET_C_LOCATIONS } from "@/data/campusData";

type ProfileTab = "profile" | "preferences" | "saved" | "privacy" | "account";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, refreshUser } = useAuth();

  // Active Tab state (defaults to "profile" or URL ?tab= parameter)
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ProfileTab | null;
      if (tabParam && ["profile", "preferences", "saved", "privacy", "account"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Personal info state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Campus Role preference (Student, Faculty, Visitor, Staff)
  const [campusRole, setCampusRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("campusway_user_role") || "Student";
    }
    return "Student";
  });

  const handleSelectRole = (role: string) => {
    setCampusRole(role);
    try {
      localStorage.setItem("campusway_user_role", role);
    } catch {}
  };

  // Avatar accent color preset
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("campusway_avatar_color") || "vermilion";
    }
    return "vermilion";
  });

  const handleSelectAvatarColor = (color: string) => {
    setAvatarColor(color);
    try {
      localStorage.setItem("campusway_avatar_color", color);
    } catch {}
  };

  // Map style preference
  const [defaultMapStyle, setDefaultMapStyle] = useState<MapLayerMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("campusway-map-style");
      if (stored && ["dark", "streets", "satellite", "blueprint"].includes(stored)) {
        return stored as MapLayerMode;
      }
    }
    return "dark";
  });

  const handleSelectDefaultMapStyle = (style: MapLayerMode) => {
    setDefaultMapStyle(style);
    try {
      localStorage.setItem("campusway-map-style", style);
      localStorage.setItem("campusway-map-style-explicit", "true");
    } catch {}
  };

  // Navigation mode preference (Walking vs Accessible)
  const [navMode, setNavMode] = useState<"walking" | "accessible">(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("campusway_pref_accessible") === "true" ? "accessible" : "walking";
    }
    return "walking";
  });

  const handleSelectNavMode = (mode: "walking" | "accessible") => {
    setNavMode(mode);
    try {
      localStorage.setItem("campusway_pref_accessible", mode === "accessible" ? "true" : "false");
    } catch {}
  };

  // Units preference (metric vs imperial)
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("campusway_pref_units") as "metric" | "imperial") || "metric";
    }
    return "metric";
  });

  const handleSelectUnitSystem = (unit: "metric" | "imperial") => {
    setUnitSystem(unit);
    try {
      localStorage.setItem("campusway_pref_units", unit);
    } catch {}
  };

  // High contrast preference
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("campusway_pref_high_contrast") === "true";
    }
    return false;
  });

  const handleToggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    try {
      localStorage.setItem("campusway_pref_high_contrast", next ? "true" : "false");
    } catch {}
  };

  // Saved locations state
  const [savedLocationSlugs, setSavedLocationSlugs] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("campusway_saved_locations");
        return stored ? JSON.parse(stored) : ["gate-1", "block-1", "block-34-area"];
      } catch {
        return ["gate-1", "block-1"];
      }
    }
    return ["gate-1", "block-1"];
  });

  const handleRemoveSavedLocation = (slug: string) => {
    const next = savedLocationSlugs.filter((s) => s !== slug);
    setSavedLocationSlugs(next);
    try {
      localStorage.setItem("campusway_saved_locations", JSON.stringify(next));
    } catch {}
  };

  // Privacy & cache management
  const [routeCacheCount, setRouteCacheCount] = useState<number>(0);
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cache = localStorage.getItem("campusway_route_cache");
        if (cache) {
          const parsed = JSON.parse(cache);
          setRouteCacheCount(Object.keys(parsed).length);
        }
      } catch {}
    }
  }, []);

  const handleClearRouteCache = () => {
    try {
      localStorage.removeItem("campusway_route_cache");
      setRouteCacheCount(0);
      setPrivacyToast("Local route cache cleared successfully.");
      setTimeout(() => setPrivacyToast(null), 3500);
    } catch {}
  };

  const handleResetViewport = () => {
    try {
      sessionStorage.removeItem("campusway_map_viewport");
      setPrivacyToast("Map camera viewport reset to LPU campus bounds.");
      setTimeout(() => setPrivacyToast(null), 3500);
    } catch {}
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Account deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

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
      <div className="min-h-screen bg-[#F6F4EF] dark:bg-[#070b14] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#E8452C]/20 border-t-[#E8452C] animate-spin" />
        <p className="mt-4 text-sm text-slate-500 dark:text-zinc-400 font-mono">Loading profile &amp; settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F4EF] dark:bg-[#070b14] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-sm">
          <CampusWayLogo className="w-8 h-8 text-[#E8452C]" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Authentication Required</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
          You must be signed in with an active session to view your profile and account settings.
        </p>
        <Link
          href="/login?redirect=/profile"
          className="px-6 py-2.5 rounded-xl bg-[#E8452C] hover:bg-[#d03d27] text-white text-sm font-semibold transition-colors shadow-lg shadow-[#E8452C]/20 cursor-pointer"
        >
          Sign In to CampusWay
        </Link>
      </div>
    );
  }

  const isGoogleAccount = user.auth_provider === "google" && !user.has_password;

  const avatarGradientMap: Record<string, string> = {
    vermilion: "from-[#E8452C] via-orange-600 to-amber-600",
    emerald: "from-emerald-600 via-teal-600 to-cyan-600",
    blue: "from-blue-600 via-indigo-600 to-violet-600",
    purple: "from-purple-600 via-fuchsia-600 to-pink-600",
    amber: "from-amber-500 via-orange-500 to-red-500",
  };

  return (
    <div className="min-h-screen bg-[#F6F4EF] dark:bg-[#070b14] text-slate-900 dark:text-zinc-100 selection:bg-[#E8452C]/30 transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0d1322]/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-slate-900 dark:text-white hover:opacity-90 transition-opacity"
            >
              <CampusWayLogo className="w-6 h-6 text-[#E8452C]" />
              <span className="text-lg font-bold tracking-tight">CampusWay</span>
            </Link>
            <span className="text-slate-300 dark:text-zinc-600">/</span>
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 font-mono">
              Profile &amp; Settings
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 transition-colors"
            >
              <CompassIcon className="w-4 h-4 text-[#E8452C]" />
              <span>Campus Map</span>
            </Link>

            <button
              onClick={() => logout()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-600 dark:text-rose-300 transition-colors cursor-pointer"
            >
              <SignOutIcon className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Profile Header Summary Card */}
        <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#111827] dark:to-[#0c121e] border border-slate-200 dark:border-zinc-800/90 p-6 sm:p-8 shadow-sm dark:shadow-2xl transition-colors">
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.picture ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-slate-100 dark:ring-zinc-800/80 shadow-md bg-slate-100 dark:bg-zinc-800">
                  <Image
                    src={user.picture}
                    alt={user.name || "User Avatar"}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${
                    avatarGradientMap[avatarColor] || avatarGradientMap.vermilion
                  } ring-4 ring-slate-100 dark:ring-zinc-800/80 shadow-md flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold tracking-wider`}
                >
                  {getInitials(user.name, user.email)}
                </div>
              )}
              {user.email_verified && (
                <div
                  title="Verified Account"
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-[#111827] shadow-sm text-xs font-bold"
                >
                  ✓
                </div>
              )}
            </div>

            {/* Profile Overview Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {user.name || "CampusWay Member"}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">{user.email}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#E8452C]/10 text-[#E8452C] border border-[#E8452C]/20 text-xs font-bold font-mono">
                    {campusRole} • LPU
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 text-xs font-medium">
                    {user.auth_provider === "google" ? "Google SSO" : "Email Auth"}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Configure personalized routing preferences, manage bookmarked locations, inspect privacy controls, and adjust your CampusWay account credentials.
              </p>
            </div>
          </div>
        </section>

        {/* 5-Tab Segmented Switcher Strip */}
        <div
          data-testid="profile-tabs-nav"
          className="flex items-center gap-1 p-1.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 overflow-x-auto shadow-xs"
        >
          {(
            [
              { id: "profile" as const, label: "Profile", icon: SettingsIcon },
              { id: "preferences" as const, label: "Preferences", icon: CompassIcon },
              { id: "saved" as const, label: "Saved & Recent", icon: BookmarkIcon },
              { id: "privacy" as const, label: "Privacy & Data", icon: CheckCircleIcon },
              { id: "account" as const, label: "Account & Security", icon: QrCodeIcon },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`profile-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#E8452C] text-white shadow-md shadow-[#E8452C]/20"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toast Notification */}
        {privacyToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{privacyToast}</span>
          </div>
        )}

        {/* ──── TAB 1: PROFILE ──── */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in">
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Your display name and identity details across CampusWay.
                  </p>
                </div>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={handleStartEditName}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 cursor-pointer"
                  >
                    Edit Name
                  </button>
                )}
              </div>

              {profileMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    profileMessage.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                    Full Name
                  </label>
                  {isEditingName ? (
                    <form onSubmit={handleSaveProfile} className="space-y-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Enter full name"
                        disabled={isSavingProfile}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-4 py-1.5 rounded-xl bg-[#E8452C] hover:bg-[#d03d27] text-white text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditName}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-sm font-medium">
                      {user.name || "Anonymous Member"}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                    Email Address
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 text-sm text-slate-500 dark:text-zinc-400 font-mono flex items-center justify-between">
                    <span>{user.email}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-bold">Verified</span>
                  </div>
                </div>

                {/* Campus Role Selector */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                    Campus Role
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Student", "Faculty", "Visitor", "Staff"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleSelectRole(role)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-medium text-xs ${
                          campusRole === role
                            ? "bg-[#E8452C]/10 border-[#E8452C] text-[#E8452C] font-bold shadow-xs"
                            : "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avatar Accent Color Picker */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                    Avatar Style Accent
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: "vermilion", name: "Vermilion", color: "bg-[#E8452C]" },
                      { id: "emerald", name: "Emerald", color: "bg-emerald-500" },
                      { id: "blue", name: "Blue", color: "bg-blue-600" },
                      { id: "purple", name: "Purple", color: "bg-purple-600" },
                      { id: "amber", name: "Amber", color: "bg-amber-500" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectAvatarColor(c.id)}
                        className={`w-9 h-9 rounded-full ${c.color} flex items-center justify-center transition-transform cursor-pointer ${
                          avatarColor === c.id ? "ring-3 ring-offset-2 ring-[#E8452C] scale-110" : "hover:scale-105"
                        }`}
                        title={c.name}
                      >
                        {avatarColor === c.id && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ──── TAB 2: PREFERENCES ──── */}
        {activeTab === "preferences" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Map Style Selection */}
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CompassIcon className="w-5 h-5 text-[#E8452C]" />
                  <span>Default Map Style</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Select your preferred default tile theme for the interactive 3D campus map.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: "dark" as const, title: "Dark Architectural", desc: "Night vector view", tag: "DEFAULT" },
                  { id: "streets" as const, title: "Clean Streets", desc: "Crisp daytime streets", tag: "LIGHT" },
                  { id: "satellite" as const, title: "Satellite Hybrid", desc: "High-res aerial imagery", tag: "PHOTO" },
                  { id: "blueprint" as const, title: "Blueprint Nav", desc: "Monochrome navigation", tag: "CYAN" },
                ].map((s) => {
                  const isSelected = defaultMapStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-testid={`pref-map-style-${s.id}`}
                      onClick={() => handleSelectDefaultMapStyle(s.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#E8452C]/10 border-[#E8452C] ring-2 ring-[#E8452C]/30 shadow-md"
                          : "bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                            {s.tag}
                          </span>
                          {isSelected && <span className="text-[#E8452C] text-xs font-bold">✓ Active</span>}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Navigation Mode & Units */}
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AccessibilityIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Wayfinding &amp; Routing Preferences</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Set accessibility route preferences and distance measurement units.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Default Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                    Routing Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectNavMode("walking")}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        navMode === "walking"
                          ? "bg-[#E8452C]/10 border-[#E8452C] text-[#E8452C] font-bold"
                          : "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <WalkingIcon className="w-5 h-5" />
                      <span className="text-xs">Standard Walking</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectNavMode("accessible")}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        navMode === "accessible"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <AccessibilityIcon className="w-5 h-5" />
                      <span className="text-xs">Wheelchair / Step-Free</span>
                    </button>
                  </div>
                </div>

                {/* Distance Units */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                    Distance Measurement Units
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectUnitSystem("metric")}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        unitSystem === "metric"
                          ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                          : "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <p className="text-xs font-bold">Metric</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Meters &amp; Kilometers</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectUnitSystem("imperial")}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        unitSystem === "imperial"
                          ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                          : "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <p className="text-xs font-bold">Imperial</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Feet &amp; Miles</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* High Contrast Toggle */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">High Contrast Map Contours</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Enhance pathway and vertex outlines for improved outdoor glare visibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHighContrast}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                    highContrast ? "bg-[#E8452C]" : "bg-slate-300 dark:bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      highContrast ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Appearance Theme Card */}
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-4 shadow-sm dark:shadow-xl">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">App Appearance</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Choose between Light, Dark, or System Default appearance.
                </p>
              </div>
              <ThemeSegmentedControl />
            </section>
          </div>
        )}

        {/* ──── TAB 3: SAVED & RECENT ──── */}
        {activeTab === "saved" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Bookmarked Places Card */}
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookmarkIcon className="w-5 h-5 text-[#E8452C]" filled />
                    <span>Saved Campus Places</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Your bookmarked buildings, gates, and services for 1-click navigation.
                  </p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 font-bold">
                  {savedLocationSlugs.length} Saved
                </span>
              </div>

              {savedLocationSlugs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedLocationSlugs.map((slug) => {
                    const loc = VERIFIED_DATASET_C_LOCATIONS.find(
                      (l) => l.slug === slug || l.id === slug
                    );
                    const name = loc?.name || (slug === "gate-1" ? "Main Gate 1 (Entrance)" : slug === "block-1" ? "Block 1 (Computer Science)" : `Campus Location (${slug})`);

                    return (
                      <div
                        key={slug}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                            ID: {slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/explore?dest=${slug}`}
                            className="px-3 py-1.5 rounded-xl bg-[#E8452C] hover:bg-[#d03d27] text-white text-xs font-semibold cursor-pointer"
                          >
                            Navigate
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveSavedLocation(slug)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="Remove bookmark"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-zinc-400 space-y-2">
                  <p className="text-sm font-semibold">No saved places yet.</p>
                  <p className="text-xs">
                    Bookmark your favorite lecture halls and gates on the interactive map.
                  </p>
                  <Link
                    href="/explore"
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#E8452C] text-white text-xs font-bold"
                  >
                    Browse Campus Map
                  </Link>
                </div>
              )}
            </section>

            {/* Recent Route History Card */}
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <RouteIcon className="w-5 h-5 text-blue-500" />
                    <span>Recent Routes</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Quickly re-calculate shortest paths to your recent destinations.
                  </p>
                </div>
                {routeCacheCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRouteCache}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-mono cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {[
                  { from: "Main Gate 1", to: "Block 1 (CSE)", dist: "235m", time: "3 min" },
                  { from: "Block 34", to: "Central Spine", dist: "340m", time: "4 min" },
                  { from: "Uni-Mall", to: "Shanti Devi Hospital", dist: "180m", time: "2 min" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.from} → {item.to}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {item.dist} &bull; ~{item.time} walking
                      </p>
                    </div>
                    <Link
                      href="/explore"
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-[#E8452C] hover:text-white text-slate-700 dark:text-zinc-300 font-semibold transition-colors cursor-pointer"
                    >
                      Re-run
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ──── TAB 4: PRIVACY & DATA ──── */}
        {activeTab === "privacy" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Zero-Server-Tracking Policy Explanation Card */}
            <section className="rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/30 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircleIcon className="w-6 h-6 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold">Zero-Server-Tracking Privacy Policy</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                CampusWay is engineered with privacy-first architecture. Your device&apos;s raw GPS coordinates are processed 100% locally on your browser. When requesting routes, only surveyed graph node IDs (e.g. <code>loc-gate-1</code>) are sent to the routing engine. Your physical GPS coordinates are <b>never uploaded, logged, or stored</b> on any server.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-emerald-500/20">
                  <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold block">GPS Storage</span>
                  <span className="font-bold text-slate-900 dark:text-white">Device RAM Only</span>
                </div>
                <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-emerald-500/20">
                  <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold block">Network Requests</span>
                  <span className="font-bold text-slate-900 dark:text-white">Survey IDs Only</span>
                </div>
                <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-emerald-500/20">
                  <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold block">Analytics</span>
                  <span className="font-bold text-slate-900 dark:text-white">Zero Tracking Beacons</span>
                </div>
              </div>
            </section>

            {/* Local Data & Route Cache Controls */}
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-5 shadow-sm dark:shadow-xl">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Local Device Storage</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Manage cached routes, map camera viewports, and local browser storage.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Local Route Cache</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Shortest path calculations stored in localStorage for instant offline replay ({routeCacheCount} routes cached).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearRouteCache}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer shrink-0 ml-3"
                  >
                    Clear Cache
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Map Viewport Memory</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Camera coordinates and pitch persisted in sessionStorage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetViewport}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-[#E8452C] hover:text-white text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer shrink-0 ml-3"
                  >
                    Reset Viewport
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ──── TAB 5: ACCOUNT & SECURITY ──── */}
        {activeTab === "account" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Account Credentials Card */}
            <section className="rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security &amp; Authentication</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Connected credentials and session security status.
                </p>
              </div>

              <div className="space-y-4">
                {/* Account ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                    Account ID (UUID)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 font-mono truncate select-all">
                      {user.id}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium border border-slate-200 dark:border-zinc-700 transition cursor-pointer"
                    >
                      {copiedId ? "Copied!" : "Copy ID"}
                    </button>
                  </div>
                </div>

                {/* Password Change Form (Email Accounts) */}
                {isGoogleAccount ? (
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-slate-700 dark:text-zinc-300 space-y-2">
                    <p className="font-bold text-blue-700 dark:text-blue-300">Google OAuth 2.0 Account</p>
                    <p>Password changes are managed through your Google Identity account.</p>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Account Password</h3>

                    {passwordMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          passwordMessage.type === "success"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-300"
                        }`}
                      >
                        {passwordMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        disabled={isChangingPassword}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 8 chars)"
                        disabled={isChangingPassword}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        disabled={isChangingPassword}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8452C]"
                      />
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-4 py-2 rounded-xl bg-[#E8452C] hover:bg-[#d03d27] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isChangingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </section>

            {/* Danger Zone: Account Deletion */}
            <section className="rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-6 sm:p-8 space-y-4">
              <h2 className="text-base font-bold text-rose-700 dark:text-rose-400">Danger Zone</h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Permanently delete your CampusWay account, bookmarks, and sessions from the database.
              </p>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Delete Account
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Account Deletion Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">Confirm Account Deletion</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-300">
              This action cannot be undone. Please type <b>DELETE</b> to confirm.
            </p>
            {deleteErrorMessage && (
              <p className="text-xs text-rose-600 font-semibold">{deleteErrorMessage}</p>
            )}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-sm focus:outline-none focus:border-rose-500 font-mono"
            />
            {user?.has_password && (
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to confirm"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-sm focus:outline-none focus:border-rose-500"
              />
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeletingAccount ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
