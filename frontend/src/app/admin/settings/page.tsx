"use client";

import React, { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import {
  CogIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  RefreshIcon,
} from "@/components/admin/AdminIcons";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [purging, setPurging] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    adminService
      .getSettings()
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePurgeCache = async () => {
    setPurging(true);
    try {
      const res = await adminService.clearCache();
      setToastMessage({ text: res.message || "Cache successfully purged.", type: "success" });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Cache invalidation failed.", type: "error" });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast */}
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

      {/* Header */}
      <div className="pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-[#E8452C]/10 text-[#E8452C] font-bold">
            INFRASTRUCTURE
          </span>
          <span className="text-xs font-mono text-muted">
            CONFIG & POLICIES
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Administrative Settings & Policies
        </h1>
        <p className="text-xs text-muted">
          Review operational parameters, cryptographic session security, and runtime cache controls.
        </p>
      </div>

      {/* System Telemetry Card */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CogIcon className="w-4 h-4 text-[#E8452C]" />
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              Runtime Telemetry
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg border border-border" style={{ backgroundColor: "var(--surface-2)" }}>
            <span className="text-muted text-[10px] uppercase block mb-1">Environment</span>
            <span className="font-semibold text-foreground">{settings?.environment || "development"}</span>
          </div>

          <div className="p-3 rounded-lg border border-border" style={{ backgroundColor: "var(--surface-2)" }}>
            <span className="text-muted text-[10px] uppercase block mb-1">Database Engine</span>
            <span className="font-semibold text-foreground">{settings?.database_type || "PostgreSQL / SQLite"}</span>
          </div>

          <div className="p-3 rounded-lg border border-border" style={{ backgroundColor: "var(--surface-2)" }}>
            <span className="text-muted text-[10px] uppercase block mb-1">API Prefix</span>
            <span className="font-semibold text-foreground">{settings?.api_v1_path || "/api/v1"}</span>
          </div>

          <div className="p-3 rounded-lg border border-border" style={{ backgroundColor: "var(--surface-2)" }}>
            <span className="text-muted text-[10px] uppercase block mb-1">Google OAuth Provider</span>
            <span className="font-semibold text-foreground">
              {settings?.google_auth_configured ? "Active" : "Dev Mock / Fallback"}
            </span>
          </div>
        </div>
      </div>

      {/* Cache & Performance Controls */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Graph Cache Management
          </h2>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          The campus graph is cached in memory for high-performance sub-millisecond Dijkstra & A* path calculations.
          If nodes, coordinates, or edge closures have been updated, flush the cache to force recalculation across all active sessions.
        </p>

        <div className="pt-2">
          <button
            onClick={handlePurgeCache}
            disabled={purging}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <CogIcon className={`w-3.5 h-3.5 ${purging ? "animate-spin" : ""}`} />
            <span>{purging ? "Purging Cache..." : "Invalidate & Purge Graph Cache"}</span>
          </button>
        </div>
      </div>

      {/* Security & Access Policies */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Administrative Security Governance
          </h2>
        </div>

        <div className="space-y-3 text-xs text-muted leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8452C] mt-1.5 shrink-0" />
            <p>
              <strong className="text-foreground">Backend-Enforced RBAC:</strong> Frontend route protection acts strictly as a UI guard. Every administrative REST endpoint independently validates JWT claims and session cookies on FastAPI before executing.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8452C] mt-1.5 shrink-0" />
            <p>
              <strong className="text-foreground">Last-Admin Invariant:</strong> The user directory service rejects any operation that would deactivate or demote the last remaining active administrator, preventing accidental administrative lockouts.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8452C] mt-1.5 shrink-0" />
            <p>
              <strong className="text-foreground">Dataset C Coordinate Provenance:</strong> Survey coordinates established during the Block 34 & Central Library ground-truth audits are preserved as ground truth. Modifications are logged to the immutable audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
