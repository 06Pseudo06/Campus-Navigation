"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminService, DashboardStats } from "@/services/adminService";
import {
  UsersIcon,
  BuildingIcon,
  GraphIcon,
  FlagIcon,
  HistoryIcon,
  CogIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
} from "@/components/admin/AdminIcons";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheClearing, setCacheClearing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClearCache = async () => {
    setCacheClearing(true);
    try {
      const res = await adminService.clearCache();
      setToastMessage({ text: res.message || "Cache successfully purged.", type: "success" });
      setTimeout(() => setToastMessage(null), 4000);
      fetchStats();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Cache invalidation failed.", type: "error" });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setCacheClearing(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("create") || action.includes("seed")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (action.includes("update") || action.includes("verify")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (action.includes("delete") || action.includes("deactivate")) return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-rose-950/90 text-rose-200 border-rose-500/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangleIcon className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-[#E8452C]/10 text-[#E8452C] font-bold">
              CONTROL CENTRE
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              LPU CAMPUS OPERATIONS
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Operations Command
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Live telemetric overview of LPU spatial graph, identity directory, and system health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClearCache}
            disabled={cacheClearing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            <CogIcon className={`w-3.5 h-3.5 ${cacheClearing ? "animate-spin" : ""}`} />
            <span>{cacheClearing ? "Purging..." : "Purge Routing Cache"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold">Failed to fetch operational telemetry</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border animate-pulse"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            />
          ))}
        </div>
      )}

      {/* Metric KPI Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Campus Locations */}
            <div
              className="p-5 rounded-xl border space-y-3 relative overflow-hidden group hover:border-[#E8452C]/30 transition-all"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Locations
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <BuildingIcon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  {stats.locations.total}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="text-emerald-500 font-mono font-medium">
                    {stats.locations.verified} Verified
                  </span>
                  <span>•</span>
                  <span>{stats.locations.unverified} Pending</span>
                </div>
              </div>
              <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border)" }}>
                <Link href="/admin/locations" className="text-[#E8452C] hover:underline flex items-center gap-1 font-medium">
                  Manage catalogue <ArrowRightIcon className="w-3 h-3" />
                </Link>
                <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {stats.locations.active} active
                </span>
              </div>
            </div>

            {/* 2. Routing Nodes & Edges */}
            <div
              className="p-5 rounded-xl border space-y-3 relative overflow-hidden group hover:border-[#E8452C]/30 transition-all"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Spatial Graph
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <GraphIcon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  {stats.routing.total_nodes}
                  <span className="text-sm font-normal ml-1" style={{ color: "var(--text-muted)" }}>nodes</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-mono text-emerald-500">
                    {stats.routing.active_edges} active edges
                  </span>
                  <span>•</span>
                  <span>{stats.routing.accessible_nodes} accessible</span>
                </div>
              </div>
              <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border)" }}>
                <Link href="/admin/routes" className="text-[#E8452C] hover:underline flex items-center gap-1 font-medium">
                  Inspect network <ArrowRightIcon className="w-3 h-3" />
                </Link>
                <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  A* / Dijkstra
                </span>
              </div>
            </div>

            {/* 3. User Directory & RBAC */}
            <div
              className="p-5 rounded-xl border space-y-3 relative overflow-hidden group hover:border-[#E8452C]/30 transition-all"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Directory
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <UsersIcon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  {stats.users.total}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-mono text-emerald-500">
                    {stats.users.active} active
                  </span>
                  <span>•</span>
                  <span>{stats.users.admins} admin</span>
                </div>
              </div>
              <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border)" }}>
                <Link href="/admin/users" className="text-[#E8452C] hover:underline flex items-center gap-1 font-medium">
                  Review roles <ArrowRightIcon className="w-3 h-3" />
                </Link>
                <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {stats.users.students} students
                </span>
              </div>
            </div>

            {/* 4. Visitor Assistance & Reports */}
            <div
              className="p-5 rounded-xl border space-y-3 relative overflow-hidden group hover:border-[#E8452C]/30 transition-all"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Assistance & Issues
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <FlagIcon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  {stats.assistance.pending + stats.reports.pending}
                  <span className="text-sm font-normal ml-1 text-amber-500">pending</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{stats.assistance.total} requests</span>
                  <span>•</span>
                  <span>{stats.reports.total} reports</span>
                </div>
              </div>
              <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border)" }}>
                <Link href="/admin/reports" className="text-[#E8452C] hover:underline flex items-center gap-1 font-medium">
                  Triage queue <ArrowRightIcon className="w-3 h-3" />
                </Link>
                <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {stats.assistance.resolved + stats.reports.resolved} resolved
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Status Strip */}
          <div
            className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs font-mono"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold tracking-wider" style={{ color: "var(--text)" }}>
                CORE TELEMETRY
              </span>
              <span style={{ color: "var(--text-muted)" }}>|</span>
              <span style={{ color: "var(--text-muted)" }}>
                Database: <strong className="text-foreground">{stats.system.database_type.toUpperCase()}</strong>
              </span>
              <span style={{ color: "var(--text-muted)" }}>•</span>
              <span style={{ color: "var(--text-muted)" }}>
                Env: <strong className="text-foreground">{stats.system.environment.toUpperCase()}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                DB Connection Healthy
              </span>
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                Google OAuth: {stats.system.google_auth_configured ? "Configured" : "Simulated/Dev"}
              </span>
            </div>
          </div>

          {/* Grid: Categories Breakdown & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1-col: Categories Distribution */}
            <div
              className="p-5 rounded-xl border space-y-4"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                  Location Categories
                </h2>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {Object.keys(stats.locations.by_category).length} types
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(stats.locations.by_category).map(([cat, count]) => {
                  const percent = Math.round((count / (stats.locations.total || 1)) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="capitalize" style={{ color: "var(--text)" }}>
                          {cat.replace("_", " ")}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
                        <div
                          className="h-full rounded-full bg-[#E8452C] transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/locations"
                  className="w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <BuildingIcon className="w-3.5 h-3.5" />
                  View All Campus POIs
                </Link>
              </div>
            </div>

            {/* Right 2-col: Recent Audit Activity */}
            <div
              className="lg:col-span-2 p-5 rounded-xl border space-y-4"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-[#E8452C]" />
                  <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                    Administrative Activity Trail
                  </h2>
                </div>
                <Link
                  href="/admin/audit-logs"
                  className="text-xs text-[#E8452C] hover:underline font-medium flex items-center gap-1"
                >
                  Full audit log <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              {stats.recent_activity.length === 0 ? (
                <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  No recent administrative actions recorded.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b font-mono text-[10px] uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3">Actor</th>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Entity</th>
                        <th className="py-2 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {stats.recent_activity.slice(0, 7).map((log) => (
                        <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                            {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </td>
                          <td className="py-2.5 px-3 font-medium max-w-[140px] truncate" style={{ color: "var(--text)" }}>
                            {log.actor_email || "System"}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {log.entity_type}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] max-w-[200px] truncate" style={{ color: "var(--text-muted)" }}>
                            {log.details || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
