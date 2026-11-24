"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService, GraphValidationResult } from "@/services/adminService";
import { BackendNode, BackendEdge } from "@/services/locationService";
import {
  GraphIcon,
  CrosshairIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  PlusIcon,
  SearchIcon,
  CogIcon,
  ArrowRightIcon,
} from "@/components/admin/AdminIcons";

export default function AdminRoutesPage() {
  const [activeTab, setActiveTab] = useState<"nodes" | "edges" | "diagnostics">("diagnostics");

  // Data states
  const [nodes, setNodes] = useState<BackendNode[]>([]);
  const [edges, setEdges] = useState<BackendEdge[]>([]);
  const [validation, setValidation] = useState<GraphValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search filters
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Action States
  const [nodeModalOpen, setNodeModalOpen] = useState<boolean>(false);
  const [isNewNode, setIsNewNode] = useState<boolean>(false);
  const [activeNode, setActiveNode] = useState<Partial<BackendNode>>({});

  const [edgeModalOpen, setEdgeModalOpen] = useState<boolean>(false);
  const [isNewEdge, setIsNewEdge] = useState<boolean>(false);
  const [activeEdge, setActiveEdge] = useState<Partial<BackendEdge>>({});

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nList, eList, val] = await Promise.all([
        adminService.listNodes().catch(() => [] as BackendNode[]),
        adminService.listEdges().catch(() => [] as BackendEdge[]),
        adminService.validateGraph().catch(() => null),
      ]);
      setNodes(nList);
      setEdges(eList);
      setValidation(val);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch routing network data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Node Actions
  const handleOpenAddNode = () => {
    setIsNewNode(true);
    setActiveNode({
      node_type: "intersection",
      latitude: 31.2536,
      longitude: 75.7037,
      floor: 0,
      is_accessible: true,
      is_active: true,
    });
    setNodeModalOpen(true);
  };

  const handleOpenEditNode = (node: BackendNode) => {
    setIsNewNode(false);
    setActiveNode({ ...node });
    setNodeModalOpen(true);
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isNewNode) {
        await adminService.createNode(activeNode);
        setToastMessage({ text: "Spatial node created.", type: "success" });
      } else if (activeNode.id) {
        await adminService.updateNode(activeNode.id, activeNode);
        setToastMessage({ text: "Node coordinates updated.", type: "success" });
      }
      setNodeModalOpen(false);
      fetchGraphData();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to save node.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Edge Actions
  const handleOpenAddEdge = () => {
    setIsNewEdge(true);
    setActiveEdge({
      source_node_id: nodes[0]?.id || "",
      target_node_id: nodes[1]?.id || "",
      distance_m: 10,
      path_type: "footpath",
      is_accessible: true,
      is_active: true,
    });
    setEdgeModalOpen(true);
  };

  const handleOpenEditEdge = (edge: BackendEdge) => {
    setIsNewEdge(false);
    setActiveEdge({ ...edge });
    setEdgeModalOpen(true);
  };

  const handleSaveEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdge.source_node_id || !activeEdge.target_node_id) {
      setToastMessage({ text: "Source and target nodes are required.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      if (isNewEdge) {
        await adminService.createEdge(activeEdge);
        setToastMessage({ text: "Path connection created.", type: "success" });
      } else if (activeEdge.id) {
        await adminService.updateEdge(activeEdge.id, activeEdge);
        setToastMessage({ text: "Edge weights updated.", type: "success" });
      }
      setEdgeModalOpen(false);
      fetchGraphData();
    } catch (err: any) {
      setToastMessage({ text: err?.message || "Failed to save edge.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNodes = nodes.filter(
    (n) =>
      n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.node_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEdges = edges.filter(
    (e) =>
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.source_node_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.target_node_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.path_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              TOPOLOGY & PATHFINDING
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {nodes.length} NODES • {edges.length} EDGES
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Routing Graph Management
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Inspect topological graph connectivity, validate pathfinding integrity, and configure accessible routes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchGraphData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Validate Network</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: "var(--border)" }}>
        {[
          { id: "diagnostics", label: "Graph Diagnostics", count: validation?.disconnected_count ? `${validation.disconnected_count} warnings` : "Valid" },
          { id: "nodes", label: "Routing Nodes", count: nodes.length },
          { id: "edges", label: "Path Connections (Edges)", count: edges.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "border-[#E8452C] text-[#E8452C] font-semibold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === tab.id
                  ? "bg-[#E8452C]/10 text-[#E8452C]"
                  : "bg-black/5 dark:bg-white/5 text-muted"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: DIAGNOSTICS */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          {validation ? (
            <>
              {/* Summary Banner */}
              <div
                className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  validation.is_valid
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      validation.is_valid ? "bg-emerald-500/10" : "bg-amber-500/10"
                    }`}
                  >
                    {validation.is_valid ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <AlertTriangleIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight">
                      {validation.is_valid
                        ? "Campus Routing Network is Fully Connected"
                        : `${validation.disconnected_count} Disconnected Nodes Detected`}
                    </h3>
                    <p className="text-xs opacity-90">
                      {validation.is_valid
                        ? "Every active spatial node has pathfinding continuity across Dijkstra / A* routing engines."
                        : "Some active nodes have no connected path edges. Pedestrians routed to these nodes will be stranded."}
                    </p>
                  </div>
                </div>

                <div className="font-mono text-xs text-right shrink-0">
                  <div>Active Nodes: {validation.active_nodes}</div>
                  <div>Active Edges: {validation.active_edges}</div>
                </div>
              </div>

              {/* Disconnected Nodes Warning List */}
              {validation.disconnected_active_nodes.length > 0 && (
                <div
                  className="p-5 rounded-xl border space-y-3"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold tracking-tight text-amber-500 flex items-center gap-2">
                      <AlertTriangleIcon className="w-4 h-4" />
                      Isolated Active Nodes
                    </h3>
                    <span className="text-[10px] font-mono text-muted">
                      Requires edge connections
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {validation.disconnected_active_nodes.map((node) => (
                      <div
                        key={node.id}
                        className="p-3 rounded-lg border flex flex-col justify-between gap-2 text-xs"
                        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
                      >
                        <div>
                          <div className="font-mono text-[11px] font-semibold truncate" style={{ color: "var(--text)" }}>
                            {node.id}
                          </div>
                          <div className="text-[10px] font-mono uppercase text-muted">
                            Type: {node.node_type}
                          </div>
                        </div>
                        <div className="font-mono text-[10px] text-muted flex items-center justify-between">
                          <span>{node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}</span>
                          <button
                            onClick={() => {
                              setActiveTab("edges");
                              setIsNewEdge(true);
                              setActiveEdge({ source_node_id: node.id, target_node_id: "" });
                              setEdgeModalOpen(true);
                            }}
                            className="text-[#E8452C] hover:underline flex items-center gap-1 font-sans font-medium"
                          >
                            Connect edge <ArrowRightIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs text-muted">
              Running graph continuity diagnostics...
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NODES TABLE */}
      {activeTab === "nodes" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes by ID or type..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <button
              onClick={handleOpenAddNode}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Node</span>
            </button>
          </div>

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
                    <th className="py-3 px-4">Node ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
                    <th className="py-3 px-4">Floor</th>
                    <th className="py-3 px-4">Accessible</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filteredNodes.map((n) => (
                    <tr key={n.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium truncate max-w-[160px]" style={{ color: "var(--text)" }}>
                        {n.id}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize border border-border">
                          {n.node_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap text-muted">
                        {n.latitude.toFixed(6)}, {n.longitude.toFixed(6)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-muted">
                        {n.floor ?? 0}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono ${n.is_accessible ? "text-emerald-500" : "text-amber-500"}`}>
                          {n.is_accessible ? "Wheelchair Yes" : "Step Only"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono ${n.is_active ? "text-emerald-500" : "text-rose-500"}`}>
                          {n.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditNode(n)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EDGES TABLE */}
      {activeTab === "edges" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search edges by node or type..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <button
              onClick={handleOpenAddEdge}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-[#E8452C] hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Edge Connection</span>
            </button>
          </div>

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
                    <th className="py-3 px-4">Edge ID</th>
                    <th className="py-3 px-4">Source $\leftrightarrow$ Target</th>
                    <th className="py-3 px-4">Distance (m)</th>
                    <th className="py-3 px-4">Path Type</th>
                    <th className="py-3 px-4">Accessible</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filteredEdges.map((e) => (
                    <tr key={e.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium truncate max-w-[120px]" style={{ color: "var(--text)" }}>
                        {e.id}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        <span className="text-[#E8452C]">{e.source_node_id.substring(0, 10)}...</span>
                        <span className="mx-1 text-muted">$\leftrightarrow$</span>
                        <span className="text-[#E8452C]">{e.target_node_id.substring(0, 10)}...</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-muted">
                        {(e.distance_m ?? e.distance_meters ?? 0).toFixed(1)}m
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize border border-border">
                          {e.path_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono ${e.is_accessible ? "text-emerald-500" : "text-amber-500"}`}>
                          {e.is_accessible ? "Yes" : "Stairs"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono ${e.is_active ? "text-emerald-500" : "text-rose-500"}`}>
                          {e.is_active ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditEdge(e)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Node Edit / Add Modal */}
      {nodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveNode}
            className="max-w-md w-full p-6 rounded-2xl border space-y-4 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                {isNewNode ? "Add Spatial Node" : "Edit Node Coordinates"}
              </h3>
              <button type="button" onClick={() => setNodeModalOpen(false)} className="text-xs text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Node Type</label>
                <select
                  value={activeNode.node_type || "intersection"}
                  onChange={(e) => setActiveNode({ ...activeNode, node_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <option value="intersection">Intersection</option>
                  <option value="entrance">Building Entrance</option>
                  <option value="hallway">Hallway / Corridor</option>
                  <option value="stairwell">Stairwell</option>
                  <option value="elevator">Elevator</option>
                  <option value="outdoor">Outdoor Pathway</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={activeNode.latitude ?? 31.2536}
                  onChange={(e) => setActiveNode({ ...activeNode, latitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={activeNode.longitude ?? 75.7037}
                  onChange={(e) => setActiveNode({ ...activeNode, longitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Floor Level</label>
                <input
                  type="number"
                  value={activeNode.floor ?? 0}
                  onChange={(e) => setActiveNode({ ...activeNode, floor: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNode.is_accessible ?? true}
                    onChange={(e) => setActiveNode({ ...activeNode, is_accessible: e.target.checked })}
                    className="text-[#E8452C] focus:ring-[#E8452C]"
                  />
                  <span>Wheelchair Accessible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNode.is_active ?? true}
                    onChange={(e) => setActiveNode({ ...activeNode, is_active: e.target.checked })}
                    className="text-[#E8452C] focus:ring-[#E8452C]"
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={() => setNodeModalOpen(false)}
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
                {submitting ? "Saving..." : isNewNode ? "Create Node" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edge Edit / Add Modal */}
      {edgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveEdge}
            className="max-w-md w-full p-6 rounded-2xl border space-y-4 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
                {isNewEdge ? "Connect New Edge" : "Edit Edge Properties"}
              </h3>
              <button type="button" onClick={() => setEdgeModalOpen(false)} className="text-xs text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Source Node ID</label>
                <input
                  type="text"
                  required
                  value={activeEdge.source_node_id || ""}
                  onChange={(e) => setActiveEdge({ ...activeEdge, source_node_id: e.target.value })}
                  placeholder="Paste source node ID..."
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Target Node ID</label>
                <input
                  type="text"
                  required
                  value={activeEdge.target_node_id || ""}
                  onChange={(e) => setActiveEdge({ ...activeEdge, target_node_id: e.target.value })}
                  placeholder="Paste target node ID..."
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Distance (Meters)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={activeEdge.distance_m ?? activeEdge.distance_meters ?? 10}
                  onChange={(e) => setActiveEdge({ ...activeEdge, distance_m: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Path Type</label>
                <select
                  value={activeEdge.path_type || "footpath"}
                  onChange={(e) => setActiveEdge({ ...activeEdge, path_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-[#E8452C]"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <option value="footpath">Footpath / Walkway</option>
                  <option value="corridor">Building Corridor</option>
                  <option value="stairs">Staircase</option>
                  <option value="ramp">Accessible Ramp</option>
                  <option value="crosswalk">Pedestrian Crosswalk</option>
                  <option value="bridge">Connecting Overpass / Bridge</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeEdge.is_accessible ?? true}
                    onChange={(e) => setActiveEdge({ ...activeEdge, is_accessible: e.target.checked })}
                    className="text-[#E8452C] focus:ring-[#E8452C]"
                  />
                  <span>Accessible Path</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeEdge.is_active ?? true}
                    onChange={(e) => setActiveEdge({ ...activeEdge, is_active: e.target.checked })}
                    className="text-[#E8452C] focus:ring-[#E8452C]"
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={() => setEdgeModalOpen(false)}
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
                {submitting ? "Saving..." : isNewEdge ? "Create Edge" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
