"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  UsersIcon,
  BuildingIcon,
  GraphIcon,
  FlagIcon,
  HistoryIcon,
  CogIcon,
  QrCodeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "./AdminIcons";

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Overview", href: "/admin", icon: DashboardIcon },
  { name: "Users", href: "/admin/users", icon: UsersIcon },
  { name: "Campus Locations", href: "/admin/locations", icon: BuildingIcon },
  { name: "Routing Graph", href: "/admin/routes", icon: GraphIcon },
  { name: "Reports & Help", href: "/admin/reports", icon: FlagIcon },
  { name: "Audit Trail", href: "/admin/audit-logs", icon: HistoryIcon },
  { name: "System Settings", href: "/admin/settings", icon: CogIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <aside
      className={`relative flex flex-col justify-between shrink-0 border-r transition-all duration-300 z-30 print:hidden ${
        collapsed ? "w-18" : "w-64"
      }`}
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#E8452C] flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-xs">
              CW
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold tracking-tight text-sm truncate" style={{ color: "var(--text)" }}>
                  CampusWay
                </span>
                <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                  Operations Admin
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            {!collapsed ? "Workspace" : "•"}
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#E8452C] text-white shadow-sm font-semibold"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={!isActive ? { color: "var(--text)" } : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : ""}`} />
                {!collapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-500 font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/admin/qr"
          title={collapsed ? "Print QR Sheet" : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
            pathname === "/admin/qr"
              ? "bg-black/10 dark:bg-white/10 font-medium"
              : "hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          style={{ color: "var(--text)" }}
        >
          <QrCodeIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Signpost QR Sheet</span>}
        </Link>

        <Link
          href="/explore"
          title={collapsed ? "Exit to Public Site" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ExternalLinkIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Exit to CampusWay</span>}
        </Link>
      </div>
    </aside>
  );
}
