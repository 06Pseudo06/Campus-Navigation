"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService, AuditLogItem } from "@/services/adminService";
import {
  HistoryIcon,
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  AlertTriangleIcon,
} from "@/components/admin/AdminIcons";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchActor, setSearchActor] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const limit = 25;

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listAuditLogs({
        actor_email: searchActor.trim() || undefined,
        action: actionFilter || undefined,
        entity_type: entityTypeFilter || undefined,
        skip: page * limit,
        limit,
      });
      setLogs(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load audit trail.");
    } finally {
      setLoading(false);
    }
  }, [searchActor, actionFilter, entityTypeFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    if (action.includes("create") || action.includes("seed")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (action.includes("update") || action.includes("verify")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (action.includes("delete") || action.includes("deactivate") || action.includes("suspend")) return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-[#E8452C]/10 text-[#E8452C] font-bold">
              SECURITY AUDIT TRAIL
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              IMMUTABLE CHRONOLOGICAL LEDGER
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Administrative Activity Trail
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Cryptographically audited log of user role elevations, spatial graph modifications, and operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors self-start sm:self-auto"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex-1 relative">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchActor}
            onChange={(e) => setSearchActor(e.target.value)}
            placeholder="Search by actor email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <FilterIcon className="w-3.5 h-3.5 text-muted" />
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(0);
              }}
              className="py-2 px-3 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="">All Entities</option>
              <option value="user">Users</option>
              <option value="location">Locations</option>
              <option value="routing">Routing Graph</option>
              <option value="node">Nodes</option>
              <option value="edge">Edges</option>
              <option value="system">System / Cache</option>
            </select>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="py-2 px-3 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">All Actions</option>
            <option value="user.role.update">Role Changes</option>
            <option value="user.status.update">Account Status</option>
            <option value="location.create">Location Created</option>
            <option value="location.update">Location Updated</option>
            <option value="routing.cache.clear">Cache Purges</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className="border-b font-mono text-[10px] uppercase tracking-wider"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator / Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-muted">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-muted">
                    No audit log entries matching filters found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-muted">
                      {new Date(log.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[160px] truncate" style={{ color: "var(--text)" }}>
                      {log.actor_email || "System Engine"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] capitalize text-muted">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 8)}...)` : ""}
                    </td>
                    <td className="py-3 px-4 text-xs max-w-xs truncate text-muted">
                      {log.details || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted whitespace-nowrap">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2 py-1 text-[11px] font-mono rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#E8452C]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          className="p-4 border-t flex items-center justify-between text-xs"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
        >
          <span className="font-mono text-[11px] text-muted">
            Page {page + 1}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < limit || loading}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="max-w-lg w-full p-6 rounded-2xl border space-y-4 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-[#E8452C]" />
                <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  Audit Event Details
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedLog(null)} className="text-xs text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
                <span className="text-muted">Event ID:</span>
                <span className="col-span-2 truncate">{selectedLog.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
                <span className="text-muted">Timestamp:</span>
                <span className="col-span-2">{selectedLog.created_at}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
                <span className="text-muted">Actor:</span>
                <span className="col-span-2 text-foreground font-semibold">{selectedLog.actor_email || "System"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
                <span className="text-muted">Action:</span>
                <span className="col-span-2 text-[#E8452C]">{selectedLog.action}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
                <span className="text-muted">Target Entity:</span>
                <span className="col-span-2">{selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ""}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
                <span className="text-muted">Client IP:</span>
                <span className="col-span-2">{selectedLog.ip_address || "127.0.0.1"}</span>
              </div>

              <div>
                <span className="text-muted block mb-1">Payload / Details:</span>
                <pre className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-border overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {selectedLog.details || "No payload metadata recorded."}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
