"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ShieldCheckIcon } from "./AdminIcons";

const SECTION_LABELS: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/users": "User Accounts & RBAC",
  "/admin/locations": "Campus Locations",
  "/admin/routes": "Routing & Pathways",
  "/admin/reports": "Visitor Assistance & Issue Reports",
  "/admin/audit-logs": "Administrative Activity Audit Trail",
  "/admin/settings": "System Health & Configuration",
  "/admin/qr": "Signpost QR Code Generator",
};

export function AdminTopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const currentTitle =
    SECTION_LABELS[pathname] ||
    (pathname.startsWith("/admin/users/") ? "User Details" : "Operations Console");

  return (
    <header
      className="h-16 px-4 md:px-8 flex items-center justify-between border-b shrink-0 z-20 print:hidden"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-wider transition-colors hover:text-[#E8452C]"
          style={{ color: "var(--text-muted)" }}
        >
          Console
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text)" }}>
          {currentTitle}
        </span>
      </div>

      {/* Right Controls: System Badge, Theme Toggle, Admin Profile Chip */}
      <div className="flex items-center gap-3">
        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>PRODUCTION LIVE</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Admin Profile Chip */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: "var(--border)" }}>
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium truncate max-w-[140px]" style={{ color: "var(--text)" }}>
                {user.email}
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#E8452C] uppercase">
                {user.role || "ADMIN"}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="px-2 py-1 text-xs rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
