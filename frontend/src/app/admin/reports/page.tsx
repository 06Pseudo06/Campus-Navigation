"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService, AssistanceRequestItem, LocationReportItem } from "@/services/adminService";
import {
  FlagIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  FilterIcon,
} from "@/components/admin/AdminIcons";

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"assistance" | "reports">("assistance");

  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequestItem[]>([]);
  const [locationReports, setLocationReports] = useState<LocationReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal / Triage State
  const [selectedAssistance, setSelectedAssistance] = useState<AssistanceRequestItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<LocationReportItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchTriageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ast, rep] = await Promise.all([
        adminService.listAssistanceRequests(statusFilter || undefined).catch(() => [] as AssistanceRequestItem[]),
        adminService.listReports(statusFilter || undefined).catch(() => [] as LocationReportItem[]),
      ]);
      setAssistanceRequests(ast);
      setLocationReports(rep);
    } catch (err: any) {
      setError(err?.message || "Failed to load triage queue.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTriageData();
  }, [fetchTriageData]);

  const handleUpdateAssistance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistance) return;
    setSubmitting(true);
    try {
      await adminService.updateAssistanceRequest(selectedAssistance.id, {
        status: newStatus,
        resolution_notes: notes,
      });
      setToastMessage({ text: "Assistance request updated.", type: "success" });
      setSelectedAssistance(null);
      fetchTriageData();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to update request.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      await adminService.updateReport(selectedReport.id, {
        status: newStatus,
        resolution_notes: notes,
      });
      setToastMessage({ text: "Map report updated.", type: "success" });
      setSelectedReport(null);
      fetchTriageData();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to update report.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "assigned":
      case "reviewing":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "rejected":
      case "cancelled":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-black/5 dark:bg-white/5 border-border";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-[#E8452C]/10 text-[#E8452C] font-bold">
              VISITOR ASSISTANCE & FEEDBACK
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {assistanceRequests.length} REQUESTS • {locationReports.length} REPORTS
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Assistance & Issue Reports
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Triage visitor requests for mobility assistance and review community map discrepancy tickets.
          </p>
        </div>

        <button
          onClick={fetchTriageData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("assistance")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "assistance"
                ? "border-[#E8452C] text-[#E8452C] font-semibold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>Mobility Assistance</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#E8452C]/10 text-[#E8452C]">
              {assistanceRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "reports"
                ? "border-[#E8452C] text-[#E8452C] font-semibold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>Map Discrepancy Reports</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-500">
              {locationReports.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <FilterIcon className="w-3.5 h-3.5 text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned / In Review</option>
            <option value="resolved">Resolved</option>
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

      {/* TAB 1: MOBILITY ASSISTANCE */}
      {activeTab === "assistance" && (
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
                  <th className="py-3 px-4">Requester / Contact</th>
                  <th className="py-3 px-4">Assistance Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {loading && assistanceRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted">
                      Loading assistance queue...
                    </td>
                  </tr>
                ) : assistanceRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted">
                      No assistance requests in queue.
                    </td>
                  </tr>
                ) : (
                  assistanceRequests.map((item) => (
                    <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs" style={{ color: "var(--text)" }}>
                          {item.requester_name || "Anonymous Guest"}
                        </div>
                        <div className="font-mono text-[11px] text-muted">
                          {item.contact_phone || "No phone provided"}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs capitalize text-[#E8452C] font-medium">
                          {item.assistance_type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs max-w-xs truncate text-muted">
                        {item.description || "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-muted">
                        {new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedAssistance(item);
                            setNewStatus(item.status);
                            setNotes(item.resolution_notes || "");
                          }}
                          className="px-2.5 py-1 rounded text-[11px] font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          Triage / Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MAP DISCREPANCY REPORTS */}
      {activeTab === "reports" && (
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
                  <th className="py-3 px-4">Report Type</th>
                  <th className="py-3 px-4">Entity / ID</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {loading && locationReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted">
                      Loading map reports...
                    </td>
                  </tr>
                ) : locationReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted">
                      No map discrepancy reports found.
                    </td>
                  </tr>
                ) : (
                  locationReports.map((item) => (
                    <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs capitalize text-[#E8452C] font-semibold">
                          {item.report_type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted truncate max-w-[140px]">
                        {item.location_id || item.node_id || item.edge_id || "General"}
                      </td>
                      <td className="py-3 px-4 text-xs max-w-sm truncate text-muted">
                        {item.description || "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-muted">
                        {new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedReport(item);
                            setNewStatus(item.status);
                            setNotes(item.resolution_notes || "");
                          }}
                          className="px-2.5 py-1 rounded text-[11px] font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          Review Ticket
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Triage Assistance Modal */}
      {selectedAssistance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleUpdateAssistance}
            className="max-w-md w-full p-6 rounded-2xl border space-y-4 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                Update Assistance Ticket
              </h3>
              <button type="button" onClick={() => setSelectedAssistance(null)} className="text-xs text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <option value="pending">Pending Triage</option>
                  <option value="assigned">Assigned to Campus Patrol</option>
                  <option value="resolved">Resolved / Escorted</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Resolution / Dispatch Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on officer assigned, wheelchair dispatched, or resolution timestamp..."
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={() => setSelectedAssistance(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#E8452C] disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Save Resolution"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Triage Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleUpdateReport}
            className="max-w-md w-full p-6 rounded-2xl border space-y-4 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                Review Map Discrepancy
              </h3>
              <button type="button" onClick={() => setSelectedReport(null)} className="text-xs text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Under Survey Investigation</option>
                  <option value="resolved">Resolved / Map Updated</option>
                  <option value="rejected">Rejected / Invalid</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe topology adjustment or reason for closing..."
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#E8452C] disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Resolution"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
