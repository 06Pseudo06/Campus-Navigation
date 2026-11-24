"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/adminService";
import { BackendLocation } from "@/services/locationService";
import {
  BuildingIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  CrosshairIcon,
} from "@/components/admin/AdminIcons";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "academic_block", label: "Academic Blocks" },
  { value: "building", label: "General Buildings" },
  { value: "food_court", label: "Food & Dining" },
  { value: "landmark", label: "Landmarks & Plazas" },
  { value: "gate", label: "Campus Gates" },
  { value: "hostel", label: "Student Residences" },
  { value: "sports", label: "Sports & Recreation" },
];

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<BackendLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");

  // Modals & Forms
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [activeLocation, setActiveLocation] = useState<Partial<BackendLocation>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete / Archive Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [locationToDelete, setLocationToDelete] = useState<BackendLocation | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const is_verified =
        verifiedFilter === "" ? undefined : verifiedFilter === "true";
      const data = await adminService.listLocations({
        query: search.trim() || undefined,
        location_type: categoryFilter || undefined,
        is_verified,
        limit: 100,
      });
      setLocations(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load campus locations.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, verifiedFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLocations();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchLocations]);

  const handleOpenAdd = () => {
    setIsNew(true);
    setActiveLocation({
      name: "",
      short_code: "",
      location_type: "academic_block",
      latitude: 31.2536,
      longitude: 75.7037,
      building: "",
      floor: "Ground",
      description: "",
      is_verified: true,
      is_active: true,
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (loc: BackendLocation) => {
    setIsNew(false);
    setActiveLocation({ ...loc });
    setEditModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLocation.name || !activeLocation.short_code) {
      setToastMessage({ text: "Name and short code are required.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<BackendLocation> = {
        ...activeLocation,
        slug: activeLocation.slug || (activeLocation.short_code || activeLocation.name || "").toLowerCase().replace(/\s+/g, "-"),
      };
      if (isNew) {
        await adminService.createLocation(payload);
        setToastMessage({ text: `Created "${activeLocation.name}" successfully.`, type: "success" });
      } else if (activeLocation.id) {
        await adminService.updateLocation(activeLocation.id, payload);
        setToastMessage({ text: `Updated "${activeLocation.name}" successfully.`, type: "success" });
      }
      setEditModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to save location.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVerify = async (loc: BackendLocation) => {
    try {
      const updated = !loc.is_verified;
      await adminService.verifyLocation(loc.id, updated);
      setToastMessage({
        text: `Location "${loc.name}" marked as ${updated ? "VERIFIED" : "UNVERIFIED"}.`,
        type: "success",
      });
      fetchLocations();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Verification toggle failed.", type: "error" });
    }
  };

  const handleDeactivate = async () => {
    if (!locationToDelete) return;
    setSubmitting(true);
    try {
      await adminService.deactivateLocation(locationToDelete.id);
      setToastMessage({ text: `Archived "${locationToDelete.name}".`, type: "success" });
      setDeleteModalOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to archive location.", type: "error" });
    } finally {
      setSubmitting(false);
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
              SPATIAL REPOSITORY
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {locations.length} CAMPUS ENTITIES
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Campus Location Management
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Maintain Points of Interest, ensure Dataset C coordinate provenance, and verify campus POIs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLocations}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity shadow-sm"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add POI Location</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex-1 relative">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location name or code..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <FilterIcon className="w-3.5 h-3.5 text-muted" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="py-2 px-3 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">All Verification</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Location Cards & Table */}
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
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Code / Category</th>
                <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {loading && locations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshIcon className="w-5 h-5 animate-spin text-[#E8452C]" />
                      <span>Loading campus spatial dataset...</span>
                    </div>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    No campus locations matching filters found.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => {
                  const isDatasetC =
                    loc.short_code &&
                    ["B34", "B36", "B37", "B38", "UB", "LIB", "H3", "H4", "H5", "H6", "G1", "G2", "G3", "G4"].includes(
                      loc.short_code.toUpperCase()
                    );

                  return (
                    <tr key={loc.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      {/* Name & Building */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#E8452C] shrink-0">
                            <BuildingIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold truncate text-xs" style={{ color: "var(--text)" }}>
                                {loc.name}
                              </span>
                              {isDatasetC && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold" title="Verified in Dataset C Ground Truth">
                                  DATASET C
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                              {loc.building || "Campus Ground"} {loc.floor ? `• Floor ${loc.floor}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Code / Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-[#E8452C]">
                            {loc.short_code || "—"}
                          </span>
                          <span className="text-[10px] font-mono uppercase capitalize" style={{ color: "var(--text-muted)" }}>
                            {(loc.location_type || "building").replace("_", " ")}
                          </span>
                        </div>
                      </td>

                      {/* Coordinates */}
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        <div className="flex items-center gap-1">
                          <CrosshairIcon className="w-3 h-3 text-emerald-500" />
                          <span>
                            {(loc.latitude ?? 0).toFixed(6)}, {(loc.longitude ?? 0).toFixed(6)}
                          </span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleVerify(loc)}
                          title="Click to toggle verified status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border transition-colors ${
                            loc.is_verified
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                        >
                          <CheckCircleIcon className="w-3 h-3" />
                          <span>{loc.is_verified ? "Verified" : "Unverified"}</span>
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                            loc.is_active !== false
                              ? "text-emerald-500"
                              : "text-rose-500 line-through"
                          }`}
                        >
                          {loc.is_active !== false ? "Active" : "Archived"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(loc)}
                            className="px-2.5 py-1 rounded text-[11px] font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            style={{ borderColor: "var(--border)", color: "var(--text)" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setLocationToDelete(loc);
                              setDeleteModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded text-[11px] font-medium border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveLocation}
            className="max-w-xl w-full p-6 rounded-2xl border space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                {isNew ? "Add Campus Location POI" : `Edit "${activeLocation.name}"`}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-xs hover:text-foreground"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={activeLocation.name || ""}
                  onChange={(e) => setActiveLocation({ ...activeLocation, name: e.target.value })}
                  placeholder="e.g. Block 34 (School of Computer Science)"
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Short Code / Monogram *
                </label>
                <input
                  type="text"
                  required
                  value={activeLocation.short_code || ""}
                  onChange={(e) => setActiveLocation({ ...activeLocation, short_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. B34"
                  className="w-full px-3 py-2 rounded-lg border bg-transparent uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Category
                </label>
                <select
                  value={activeLocation.location_type || "academic_block"}
                  onChange={(e) => setActiveLocation({ ...activeLocation, location_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {CATEGORIES.filter((c) => c.value !== "").map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Latitude (WGS84) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={activeLocation.latitude ?? 31.2536}
                  onChange={(e) => setActiveLocation({ ...activeLocation, latitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Longitude (WGS84) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={activeLocation.longitude ?? 75.7037}
                  onChange={(e) => setActiveLocation({ ...activeLocation, longitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Parent Building
                </label>
                <input
                  type="text"
                  value={activeLocation.building || ""}
                  onChange={(e) => setActiveLocation({ ...activeLocation, building: e.target.value })}
                  placeholder="e.g. Block 34"
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Floor Reference
                </label>
                <input
                  type="text"
                  value={activeLocation.floor || ""}
                  onChange={(e) => setActiveLocation({ ...activeLocation, floor: e.target.value })}
                  placeholder="e.g. 1st Floor / Ground"
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold block" style={{ color: "var(--text)" }}>
                  Description / Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={activeLocation.description || ""}
                  onChange={(e) => setActiveLocation({ ...activeLocation, description: e.target.value })}
                  placeholder="Access instructions, survey notes, landmarks..."
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeLocation.is_verified ?? true}
                    onChange={(e) => setActiveLocation({ ...activeLocation, is_verified: e.target.checked })}
                    className="text-[#E8452C] focus:ring-[#E8452C]"
                  />
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    Verified Ground Truth (Dataset C)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeLocation.is_active ?? true}
                    onChange={(e) => setActiveLocation({ ...activeLocation, is_active: e.target.checked })}
                    className="text-[#E8452C] focus:ring-[#E8452C]"
                  />
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    Active POI (Visible in Explore)
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Saving..." : isNew ? "Create Location" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deleteModalOpen && locationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="max-w-md w-full p-6 rounded-2xl border space-y-4 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                  Archive Location
                </h3>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {locationToDelete.name} ({locationToDelete.short_code})
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Archiving this location will hide it from the public campus search and navigation index while preserving historic routing logs.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
