"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService, UserListResult } from "@/services/adminService";
import { UserProfile } from "@/types/auth";
import {
  UsersIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  SearchIcon,
  FilterIcon,
} from "@/components/admin/AdminIcons";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const limit = 15;

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [newRole, setNewRole] = useState<string>("student");
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const is_active = statusFilter === "" ? undefined : statusFilter === "true";
      const data: UserListResult = await adminService.listUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        is_active,
        skip: page * limit,
        limit,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || "Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setActionInProgress(true);
    try {
      await adminService.updateUserRole(selectedUser.id, newRole);
      setToastMessage({
        text: `Role for ${selectedUser.email} updated to ${newRole.toUpperCase()}.`,
        type: "success",
      });
      setRoleModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to update role.", type: "error" });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!selectedUser) return;
    setActionInProgress(true);
    const updatedStatus = !selectedUser.is_active;
    try {
      await adminService.updateUserStatus(selectedUser.id, updatedStatus);
      setToastMessage({
        text: `Account ${selectedUser.email} is now ${updatedStatus ? "ACTIVE" : "SUSPENDED"}.`,
        type: "success",
      });
      setStatusModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to change status.", type: "error" });
    } finally {
      setActionInProgress(false);
    }
  };

  const openRoleModal = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role || "student");
    setRoleModalOpen(true);
  };

  const openStatusModal = (user: UserProfile) => {
    setSelectedUser(user);
    setStatusModalOpen(true);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-[#E8452C]/10 text-[#E8452C] border-[#E8452C]/30";
      case "moderator":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      default:
        return "bg-black/5 dark:bg-white/5 text-foreground/80 border-border";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-[#E8452C]/10 text-[#E8452C] font-bold">
              RBAC & DIRECTORY
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {total} TOTAL ACCOUNTS
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            User Account Management
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Audit permissions, assign administrative roles, and regulate campus session authorization.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors self-start sm:self-auto"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex-1 relative">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by email or name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <FilterIcon className="w-3.5 h-3.5 text-muted" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="py-2 px-3 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="moderator">Moderators</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="py-2 px-3 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Suspended Only</option>
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

      {/* User Table */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className="border-b font-mono text-[10px] uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshIcon className="w-5 h-5 animate-spin text-[#E8452C]" />
                      <span>Loading campus directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    {/* User Profile Cell */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center font-bold text-xs shrink-0 font-mono" style={{ color: "var(--text)" }}>
                          {(u.full_name || u.email).substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate text-xs" style={{ color: "var(--text)" }}>
                            {u.full_name || "Campus Member"}
                          </span>
                          <span className="text-[11px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Cell */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getRoleBadge(u.role)}`}>
                        {u.role || "student"}
                      </span>
                    </td>

                    {/* Status Cell */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          u.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>

                    {/* Last Login Cell */}
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </td>

                    {/* Created At Cell */}
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Actions Cell */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openRoleModal(u)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => openStatusModal(u)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                            u.is_active
                              ? "border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                              : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                        >
                          {u.is_active ? "Suspend" : "Activate"}
                        </button>
                      </div>
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
          <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
            Showing {users.length > 0 ? page * limit + 1 : 0} - {Math.min((page + 1) * limit, total)} of {total} accounts
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
            <span className="px-2 font-mono text-[11px]" style={{ color: "var(--text)" }}>
              Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total || loading}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="max-w-md w-full p-6 rounded-2xl border space-y-5 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8452C]/10 text-[#E8452C] flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  Assign User Role
                </h3>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-semibold block" style={{ color: "var(--text)" }}>
                Select Role Level:
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: "student",
                    name: "Student (Standard)",
                    desc: "Public navigation, route caching, issue reporting, personalized saved routes.",
                  },
                  {
                    id: "moderator",
                    name: "Campus Moderator",
                    desc: "Triage visitor assistance, review map issue reports, inspect campus locations.",
                  },
                  {
                    id: "admin",
                    name: "Operations Administrator",
                    desc: "Full administrative access: edit routing graph, modify accounts, purge caches, audit system.",
                  },
                ].map((roleOption) => (
                  <label
                    key={roleOption.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      newRole === roleOption.id
                        ? "border-[#E8452C] bg-[#E8452C]/5 ring-1 ring-[#E8452C]"
                        : "border-border hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleOption.id}
                      checked={newRole === roleOption.id}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="mt-0.5 text-[#E8452C] focus:ring-[#E8452C]"
                    />
                    <div className="space-y-0.5">
                      <div className="font-semibold" style={{ color: "var(--text)" }}>
                        {roleOption.name}
                      </div>
                      <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {roleOption.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {selectedUser.role === "admin" && newRole !== "admin" && (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[11px] flex items-start gap-2">
                  <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: Demoting an administrator will revoke their operational access. The system will reject this action if this is the last active administrator.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setRoleModalOpen(false)}
                disabled={actionInProgress}
                className="px-4 py-2 rounded-xl text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={actionInProgress || newRole === selectedUser.role}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {actionInProgress ? "Updating..." : "Confirm Role Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Modal */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="max-w-md w-full p-6 rounded-2xl border space-y-5 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedUser.is_active ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                }`}
              >
                <AlertTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  {selectedUser.is_active ? "Suspend User Account" : "Activate User Account"}
                </h3>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {selectedUser.is_active
                ? "Suspending this account will immediately revoke all active sessions and block further sign-ins across CampusWay services."
                : "Activating this account will allow the user to authenticate and interact with campus navigation."}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setStatusModalOpen(false)}
                disabled={actionInProgress}
                className="px-4 py-2 rounded-xl text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={actionInProgress}
                className={`px-4 py-2 rounded-xl text-xs font-medium text-white transition-opacity disabled:opacity-50 ${
                  selectedUser.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionInProgress ? "Processing..." : selectedUser.is_active ? "Confirm Suspension" : "Confirm Activation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
