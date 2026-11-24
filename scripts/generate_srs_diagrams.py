"""
CampusWay SRS Diagram Generator.
Generates publication-grade academic figures for the IEEE Software Requirements Specification (SRS).
Outputs high-resolution 300 DPI PNG diagrams to scripts/diagrams/ directory.
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
import matplotlib.lines as mlines

OUT_DIR = os.path.join(os.path.dirname(__file__), "diagrams")
os.makedirs(OUT_DIR, exist_ok=True)

# Styling palette
NAVY = "#0F172A"       # Deep Slate Navy
ACCENT = "#E8452C"     # Vermilion Accent
BLUE = "#1E40AF"       # Royal Blue
LIGHT_BLUE = "#EFF6FF" # Ice Blue fill
GREEN = "#065F46"      # Forest Green
LIGHT_GREEN = "#ECFDF5"# Mint fill
PURPLE = "#5B21B6"     # Deep Purple
LIGHT_PURPLE = "#F5F3FF"
AMBER = "#92400E"      # Deep Amber
LIGHT_AMBER = "#FFFBEB"
SLATE_BORDER = "#64748B"
BG_COLOR = "#FFFFFF"

def draw_box(ax, x, y, w, h, text, title="", fill_color="#F8FAFC", border_color=NAVY, text_color=NAVY, round_rect=True, fontsize=9):
    """Draw a styled box with title and body text."""
    boxstyle = "round,pad=0.02,rounding_size=0.03" if round_rect else "square,pad=0.02"
    patch = FancyBboxPatch((x, y), w, h, boxstyle=boxstyle, ec=border_color, fc=fill_color, lw=1.5, zorder=2)
    ax.add_patch(patch)
    
    if title:
        ax.text(x + w / 2, y + h - 0.04, title, ha="center", va="top", fontsize=fontsize, fontweight="bold", color=text_color, zorder=3)
        if text:
            ax.text(x + w / 2, y + (h - 0.05) / 2, text, ha="center", va="center", fontsize=fontsize - 1, color="#334155", zorder=3, wrap=True)
    else:
        ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fontsize, fontweight="bold", color=text_color, zorder=3, wrap=True)
    return patch

def draw_arrow(ax, x1, y1, x2, y2, label="", color="#475569", lw=1.5, rad=0.0, label_offset=(0, 0.02)):
    """Draw an annotated arrow between two coordinates."""
    connectionstyle = f"arc3,rad={rad}" if rad != 0 else "arc3"
    ax.annotate(
        "", xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, shrinkA=4, shrinkB=4, connectionstyle=connectionstyle),
        zorder=4
    )
    if label:
        mx, my = (x1 + x2) / 2 + label_offset[0], (y1 + y2) / 2 + label_offset[1]
        ax.text(mx, my, label, ha="center", va="center", fontsize=7.5, color="#1E293B",
                bbox=dict(boxstyle="square,pad=0.1", fc="#FFFFFF", ec="none", alpha=0.85), zorder=5)

# ==============================================================================
# FIGURE 1: DFD LEVEL 0 (CONTEXT DIAGRAM)
# ==============================================================================
def generate_dfd_level_0():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    # Title
    ax.text(0.5, 0.95, "Figure 1: Context-Level Data Flow Diagram (DFD Level 0)", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.5, 0.91, "Boundary Interaction between External Entities and CampusWay System", ha="center", fontsize=9, color="#64748B")

    # Central Process: CampusWay System (0.0)
    draw_box(ax, 0.38, 0.38, 0.24, 0.24, "0.0\nCampusWay\nCampus Navigation &\nAdmin Control System", fill_color="#F1F5F9", border_color=ACCENT, text_color=NAVY, fontsize=10)

    # Entity 1: Campus Pedestrian / Visitor (Top Left)
    draw_box(ax, 0.05, 0.65, 0.22, 0.16, "Search query, Origin/Dest,\nGPS Coords, QR scans\n\n<-- Route polyline, turns,\nPOI details, assistance status", title="[External Entity]\nCampus Pedestrian", fill_color=LIGHT_BLUE, border_color=BLUE, fontsize=8)

    # Entity 2: System Administrator (Bottom Left)
    draw_box(ax, 0.05, 0.15, 0.22, 0.16, "Admin credentials, POI updates,\nGraph edits, Cache purge\n\n<-- Telemetry stats, audit logs,\nconnectivity diagnostics", title="[External Entity]\nSystem Administrator", fill_color=LIGHT_PURPLE, border_color=PURPLE, fontsize=8)

    # Entity 3: Mapbox Vector Tile Service (Top Right)
    draw_box(ax, 0.73, 0.65, 0.22, 0.16, "Tile requests (Z/X/Y),\nAccess token\n\n<-- Vector tiles, base styles,\nGL WebGL assets", title="[External Service]\nMapbox GL Services", fill_color=LIGHT_AMBER, border_color=AMBER, fontsize=8)

    # Entity 4: Browser Geolocation API (Bottom Right)
    draw_box(ax, 0.73, 0.15, 0.22, 0.16, "watchPosition() calls,\nPermission grant\n\n<-- WGS84 Lat/Lng coords,\nAccuracy radius (m)", title="[Device Hardware/API]\nBrowser Geolocation API", fill_color=LIGHT_GREEN, border_color=GREEN, fontsize=8)

    # Flows: Pedestrian <-> System
    draw_arrow(ax, 0.27, 0.75, 0.38, 0.55, "Destination / GPS coords", color=BLUE, rad=0.1)
    draw_arrow(ax, 0.38, 0.50, 0.27, 0.70, "Shortest route & HUD turns", color=BLUE, rad=0.1)

    # Flows: Admin <-> System
    draw_arrow(ax, 0.27, 0.25, 0.38, 0.43, "Management ops & RBAC token", color=PURPLE, rad=-0.1)
    draw_arrow(ax, 0.38, 0.40, 0.27, 0.20, "Audit logs & KPI telemetry", color=PURPLE, rad=-0.1)

    # Flows: System <-> Mapbox
    draw_arrow(ax, 0.62, 0.55, 0.73, 0.75, "Tile & style queries", color=AMBER, rad=-0.1)
    draw_arrow(ax, 0.73, 0.70, 0.62, 0.50, "Vector tiles & glyphs", color=AMBER, rad=-0.1)

    # Flows: System <-> GPS
    draw_arrow(ax, 0.62, 0.43, 0.73, 0.25, "Position poll request", color=GREEN, rad=0.1)
    draw_arrow(ax, 0.73, 0.20, 0.62, 0.40, "Hardware Lat/Lng (<=50m)", color=GREEN, rad=0.1)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "dfd_level_0.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 2: DFD LEVEL 1
# ==============================================================================
def generate_dfd_level_1():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 1.2)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.6, 0.96, "Figure 2: Data Flow Diagram (DFD Level 1) - Subsystem Decomposition", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.6, 0.92, "Decomposition of Processes (1.0 - 6.0) and Interacting Data Stores (D1 - D5)", ha="center", fontsize=9, color="#64748B")

    # Processes
    draw_box(ax, 0.05, 0.68, 0.20, 0.14, "Authenticate User\n(Argon2id & Sessions)", title="1.0 Auth Subsystem", fill_color="#F8FAFC", border_color=BLUE)
    draw_box(ax, 0.38, 0.68, 0.20, 0.14, "Browse & Search\nCampus POIs", title="2.0 Location Catalog", fill_color="#F8FAFC", border_color=GREEN)
    draw_box(ax, 0.72, 0.68, 0.22, 0.14, "Compute Shortest\nPath (Dijkstra / A*)", title="3.0 Routing Engine", fill_color="#F8FAFC", border_color=ACCENT)

    draw_box(ax, 0.05, 0.36, 0.20, 0.14, "GPS Tracking &\nGraph Snapping (<75m)", title="4.0 Spatial Snapper", fill_color="#F8FAFC", border_color=AMBER)
    draw_box(ax, 0.38, 0.36, 0.20, 0.14, "Optical QR Code\nScanner & Deep Link", title="5.0 QR Wayfinding", fill_color="#F8FAFC", border_color="#0D9488")
    draw_box(ax, 0.72, 0.36, 0.22, 0.14, "Admin Control &\nAudit Logging", title="6.0 Admin Console", fill_color="#F8FAFC", border_color=PURPLE)

    # Data Stores (represented as open-ended horizontal bars)
    draw_box(ax, 0.05, 0.08, 0.18, 0.10, "Credentials, Sessions,\nUser Profiles", title="D1: users & sessions", fill_color="#FEF3C7", border_color="#D97706", round_rect=False, fontsize=7.5)
    draw_box(ax, 0.28, 0.08, 0.18, 0.10, "15 Verified POIs,\nDataset C Coordinates", title="D2: locations & aliases", fill_color="#FEF3C7", border_color="#D97706", round_rect=False, fontsize=7.5)
    draw_box(ax, 0.51, 0.08, 0.18, 0.10, "27 Spatial Nodes,\n29 Walkway Segments", title="D3: nodes & edges", fill_color="#FEF3C7", border_color="#D97706", round_rect=False, fontsize=7.5)
    draw_box(ax, 0.74, 0.08, 0.18, 0.10, "Immutable Activity Logs,\nActor & IP Stored", title="D4: audit_logs", fill_color="#FEF3C7", border_color="#D97706", round_rect=False, fontsize=7.5)
    draw_box(ax, 0.97, 0.08, 0.18, 0.10, "Assistance Requests &\nDiscrepancy Tickets", title="D5: reports & tickets", fill_color="#FEF3C7", border_color="#D97706", round_rect=False, fontsize=7.5)

    # Data Flow Connections
    draw_arrow(ax, 0.15, 0.68, 0.15, 0.18, "Credentials / Hash lookup", color=BLUE)
    draw_arrow(ax, 0.48, 0.68, 0.37, 0.18, "POI search query", color=GREEN)
    draw_arrow(ax, 0.82, 0.68, 0.60, 0.18, "Fetch graph topology", color=ACCENT)
    draw_arrow(ax, 0.15, 0.36, 0.55, 0.18, "Snap to nearest node coords", color=AMBER)
    draw_arrow(ax, 0.48, 0.36, 0.37, 0.18, "Resolve target slug / POI", color="#0D9488")
    draw_arrow(ax, 0.83, 0.36, 0.83, 0.18, "Write audit trail record", color=PURPLE)
    draw_arrow(ax, 0.90, 0.36, 1.05, 0.18, "Triage & update tickets", color=PURPLE)

    # Inter-process flows
    draw_arrow(ax, 0.25, 0.75, 0.38, 0.75, "User session token", color=BLUE)
    draw_arrow(ax, 0.58, 0.75, 0.72, 0.75, "Origin / Target Node IDs", color=GREEN)
    draw_arrow(ax, 0.15, 0.50, 0.72, 0.72, "Snapped Origin Node ID", color=AMBER, rad=-0.2)
    draw_arrow(ax, 0.48, 0.50, 0.75, 0.68, "Resolved Destination Node", color="#0D9488", rad=-0.1)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "dfd_level_1.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 3: DFD LEVEL 2 (ROUTING SUBSYSTEM)
# ==============================================================================
def generate_dfd_level_2():
    fig, ax = plt.subplots(figsize=(11, 7), dpi=300)
    ax.set_xlim(0, 1.1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.55, 0.96, "Figure 3: Data Flow Diagram (DFD Level 2) - Pathfinding & Guidance Subsystem", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.55, 0.92, "Internal Functional Processing for Shortest Path Computation and Turn-by-Turn Instruction Generation", ha="center", fontsize=8.5, color="#64748B")

    draw_box(ax, 0.05, 0.55, 0.18, 0.14, "Verify Origin &\nDestination Nodes", title="3.1 Validate", fill_color="#F8FAFC", border_color=BLUE)
    draw_box(ax, 0.28, 0.55, 0.18, 0.14, "Check In-Memory\nLRU Route Cache", title="3.2 Cache Check", fill_color="#F8FAFC", border_color=AMBER)
    draw_box(ax, 0.51, 0.55, 0.20, 0.14, "Priority Queue\nRelaxation Loop", title="3.3 Dijkstra / A*", fill_color="#F8FAFC", border_color=ACCENT)
    draw_box(ax, 0.76, 0.55, 0.20, 0.14, "Trace Predecessor\nNodes Array", title="3.4 Backtrack", fill_color="#F8FAFC", border_color=GREEN)

    draw_box(ax, 0.51, 0.20, 0.20, 0.14, "Initial Forward\nBearing & Angles", title="3.5 Turn Guidance", fill_color="#F8FAFC", border_color=PURPLE)
    draw_box(ax, 0.76, 0.20, 0.20, 0.14, "Assemble JSON\n(Polyline, Dist, Time)", title="3.6 Route Builder", fill_color="#F8FAFC", border_color=NAVY)

    # Data Stores
    draw_box(ax, 0.05, 0.20, 0.18, 0.10, "Adjacency List Cache\n(27 Nodes, 29 Edges)", title="Graph Adjacency Store", fill_color="#FEF3C7", border_color="#D97706", round_rect=False, fontsize=7.5)
    draw_box(ax, 0.28, 0.20, 0.18, 0.10, "TTL 5-Min LRU\n_ROUTE_CACHE", title="LRU Route Cache Store", fill_color="#FEF3C7", border_color="#D97706", round_rect=False, fontsize=7.5)

    # Connections
    draw_arrow(ax, 0.23, 0.62, 0.28, 0.62, "Validated IDs", color=BLUE)
    draw_arrow(ax, 0.46, 0.62, 0.51, 0.62, "Cache Miss", color=AMBER)
    draw_arrow(ax, 0.37, 0.55, 0.37, 0.30, "Lookup Key", color=AMBER)
    draw_arrow(ax, 0.37, 0.69, 0.86, 0.34, "Cache Hit (Immediate Route JSON)", color=GREEN, rad=-0.3)

    draw_arrow(ax, 0.14, 0.30, 0.51, 0.57, "Graph Neighbors & Weights", color="#D97706")
    draw_arrow(ax, 0.71, 0.62, 0.76, 0.62, "Min-Cost Tree", color=ACCENT)
    draw_arrow(ax, 0.86, 0.55, 0.61, 0.34, "Ordered Node Waypoints", color=GREEN, rad=0.1)
    draw_arrow(ax, 0.71, 0.27, 0.76, 0.27, "Directions & Headings", color=PURPLE)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "dfd_level_2.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 4: USE CASE DIAGRAM
# ==============================================================================
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(11, 8), dpi=300)
    ax.set_xlim(0, 1.1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.55, 0.96, "Figure 4: UML Use Case Diagram - CampusWay Core Operations", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.55, 0.92, "Actor Roles (Students, Visitors, Mobility Pedestrians, Administrators) & System Boundaries", ha="center", fontsize=8.5, color="#64748B")

    # Boundary Box
    rect = Rectangle((0.28, 0.05), 0.54, 0.83, ec="#94A3B8", fc="#F8FAFC", lw=1.5, ls="--", zorder=1)
    ax.add_patch(rect)
    ax.text(0.55, 0.85, "CampusWay System Boundary", ha="center", fontsize=10, fontweight="bold", color="#475569")

    # Left Actors
    draw_box(ax, 0.03, 0.70, 0.20, 0.10, "Registered Campus\nStudent / Faculty", title="[Actor] Student", fill_color=LIGHT_BLUE, border_color=BLUE)
    draw_box(ax, 0.03, 0.45, 0.20, 0.10, "First-Time Campus\nVisitor / Guest", title="[Actor] Visitor", fill_color=LIGHT_GREEN, border_color=GREEN)
    draw_box(ax, 0.03, 0.20, 0.20, 0.10, "Wheelchair / Mobility-\nImpaired Pedestrian", title="[Actor] Mobility User", fill_color=LIGHT_AMBER, border_color=AMBER)

    # Right Actor
    draw_box(ax, 0.87, 0.45, 0.20, 0.10, "Campus Operations &\nSystem Administrator", title="[Actor] Admin", fill_color=LIGHT_PURPLE, border_color=PURPLE)

    # Use Cases inside boundary
    draw_box(ax, 0.32, 0.74, 0.21, 0.08, "Sign In / Register\n(Argon2id / Cookie)", fill_color="#FFFFFF", border_color=BLUE, fontsize=8)
    draw_box(ax, 0.57, 0.74, 0.21, 0.08, "Search Campus POIs\n& Locations", fill_color="#FFFFFF", border_color=BLUE, fontsize=8)

    draw_box(ax, 0.32, 0.60, 0.21, 0.08, "Compute Shortest\nPedestrian Route", fill_color="#FFFFFF", border_color=ACCENT, fontsize=8)
    draw_box(ax, 0.57, 0.60, 0.21, 0.08, "Toggle Wheelchair\nStep-Free Filter", fill_color="#FFFFFF", border_color=AMBER, fontsize=8)

    draw_box(ax, 0.32, 0.46, 0.21, 0.08, "Scan Optical QR\nSignpost Deep-Link", fill_color="#FFFFFF", border_color=GREEN, fontsize=8)
    draw_box(ax, 0.57, 0.46, 0.21, 0.08, "Real-time GPS\nSnapping (<75m)", fill_color="#FFFFFF", border_color=GREEN, fontsize=8)

    draw_box(ax, 0.32, 0.32, 0.21, 0.08, "Submit Mobility /\nLost Assistance", fill_color="#FFFFFF", border_color="#0D9488", fontsize=8)
    draw_box(ax, 0.57, 0.32, 0.21, 0.08, "Manage Users &\nRole Assignments", fill_color="#FFFFFF", border_color=PURPLE, fontsize=8)

    draw_box(ax, 0.32, 0.18, 0.21, 0.08, "Verify POIs & Map\nRouting Graph", fill_color="#FFFFFF", border_color=PURPLE, fontsize=8)
    draw_box(ax, 0.57, 0.18, 0.21, 0.08, "Inspect Immutable\nSecurity Audit Logs", fill_color="#FFFFFF", border_color=PURPLE, fontsize=8)

    draw_box(ax, 0.45, 0.08, 0.21, 0.08, "Enforce Last-Admin\nDemotion Guard", fill_color="#FFFFFF", border_color=PURPLE, fontsize=8)

    # Actor Connections
    draw_arrow(ax, 0.23, 0.75, 0.32, 0.78, color=BLUE)
    draw_arrow(ax, 0.23, 0.75, 0.57, 0.78, color=BLUE)
    draw_arrow(ax, 0.23, 0.75, 0.32, 0.64, color=BLUE)

    draw_arrow(ax, 0.23, 0.50, 0.32, 0.50, color=GREEN)
    draw_arrow(ax, 0.23, 0.50, 0.57, 0.50, color=GREEN)
    draw_arrow(ax, 0.23, 0.50, 0.32, 0.36, color=GREEN)

    draw_arrow(ax, 0.23, 0.25, 0.57, 0.64, color=AMBER)
    draw_arrow(ax, 0.23, 0.25, 0.32, 0.64, color=AMBER)

    draw_arrow(ax, 0.87, 0.50, 0.78, 0.36, color=PURPLE)
    draw_arrow(ax, 0.87, 0.50, 0.78, 0.22, color=PURPLE)
    draw_arrow(ax, 0.87, 0.50, 0.78, 0.74, color=PURPLE)
    draw_arrow(ax, 0.87, 0.45, 0.66, 0.12, color=PURPLE)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "use_case_diagram.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 5: SYSTEM ARCHITECTURE DIAGRAM
# ==============================================================================
def generate_system_architecture():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.5, 0.96, "Figure 5: Multi-Tier System Architecture Diagram", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.5, 0.92, "Separation of Presentation, Gateway, Services, Routing Engine, and Persistence", ha="center", fontsize=8.5, color="#64748B")

    # Layer 1: Presentation
    draw_box(ax, 0.05, 0.74, 0.90, 0.14,
             "Next.js 16.4.6 App Router | React 19 | Tailwind CSS v4 | Mapbox GL JS v3 | Vector SVG Map Fallback | Lucide Icons\n"
             "• Explore Map Dashboard (/explore)   • Admin Workspace (/admin)   • QR Scanner Modal   • GPS Mock Panel",
             title="Tier 1: Client Presentation Layer (Web & Mobile Browsers)", fill_color=LIGHT_BLUE, border_color=BLUE)

    # Layer 2: API Gateway & Security
    draw_box(ax, 0.05, 0.54, 0.90, 0.15,
             "FastAPI 0.110+ Uvicorn ASGI | Pydantic v2 Schema Validation | GZip Middleware | CORS Credentials Policy\n"
             "• Dual-Mode Auth Middleware (campusway_session Cookie / Bearer JWT)   • require_admin_role() Guard",
             title="Tier 2: API Gateway & Security Interceptor Layer (/api/v1)", fill_color=LIGHT_PURPLE, border_color=PURPLE)

    # Layer 3: Core Application Services
    draw_box(ax, 0.05, 0.34, 0.43, 0.15,
             "• ResilientUserRepository (Postgres + In-Memory)\n"
             "• Last-Admin Safety Invariant Enforcement\n"
             "• Immutable Security Audit Trail Recording",
             title="Tier 3A: Business Logic & Auth Services", fill_color=LIGHT_GREEN, border_color=GREEN)

    draw_box(ax, 0.52, 0.34, 0.43, 0.15,
             "• Dijkstra & A* Solvers: O((V+E) log V)\n"
             "• Haversine Spherical Metric Distance\n"
             "• Bearing Delta Turn-by-Turn Instruction Generator",
             title="Tier 3B: Spatial Graph Pathfinding Engine", fill_color=LIGHT_AMBER, border_color=AMBER)

    # Layer 4: Data Persistence
    draw_box(ax, 0.05, 0.10, 0.90, 0.18,
             "PostgreSQL 16 (Neon Serverless Cloud) / SQLite Development (campusway_dev.db)\n"
             "Alembic Versioned Relational Migrations (001_initial_schema through 006_add_audit_logs)\n"
             "• users, user_credentials, user_sessions   • locations, nodes, edges   • audit_logs, reports\n"
             "Canonical Survey Dataset C: 27 Nodes, 29 Walkway Segments, 15 Verified Destinations (Block 34 Boundary)",
             title="Tier 4: Relational Data Persistence & Spatial Datasets", fill_color="#F1F5F9", border_color=NAVY)

    # Connecting Arrows
    draw_arrow(ax, 0.50, 0.74, 0.50, 0.69, "REST JSON over HTTPS (Credentials: include)", color=NAVY)
    draw_arrow(ax, 0.27, 0.54, 0.27, 0.49, "Resolved Session & Claims", color=PURPLE)
    draw_arrow(ax, 0.73, 0.54, 0.73, 0.49, "Graph Query (Origin, Dest, Accessible)", color=AMBER)
    draw_arrow(ax, 0.27, 0.34, 0.27, 0.28, "SQLAlchemy 2.0 ORM Queries", color=GREEN)
    draw_arrow(ax, 0.73, 0.34, 0.73, 0.28, "Load Active Topology Nodes & Edges", color=AMBER)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "system_architecture.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 6: ENTITY-RELATIONSHIP DIAGRAM (ERD)
# ==============================================================================
def generate_erd_diagram():
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 1.2)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.6, 0.96, "Figure 6: Relational Database Entity-Relationship Diagram (ERD)", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.6, 0.92, "PostgreSQL Schema Representation with Foreign Key Dependencies and Multiplicities", ha="center", fontsize=8.5, color="#64748B")

    # Table 1: users
    draw_box(ax, 0.05, 0.58, 0.22, 0.28,
             "PK  id: UUID\n"
             "     full_name: VARCHAR(120)\n"
             "UQ  email: VARCHAR(255)\n"
             "     phone: VARCHAR(20)\n"
             "     role: VARCHAR(20) [CK]\n"
             "     is_active: BOOLEAN\n"
             "     created_at: TIMESTAMP\n"
             "     updated_at: TIMESTAMP",
             title="users", fill_color="#F8FAFC", border_color=BLUE, fontsize=7.5)

    # Table 2: user_credentials
    draw_box(ax, 0.34, 0.74, 0.22, 0.16,
             "PK  id: UUID\n"
             "FK  user_id: UUID (UQ)\n"
             "     password_hash: VARCHAR\n"
             "     updated_at: TIMESTAMP",
             title="user_credentials (1:1)", fill_color="#F8FAFC", border_color=BLUE, fontsize=7.5)

    # Table 3: user_sessions
    draw_box(ax, 0.34, 0.52, 0.22, 0.18,
             "PK  id: UUID\n"
             "FK  user_id: UUID\n"
             "UQ  token_hash: VARCHAR(64)\n"
             "     expires_at: TIMESTAMP\n"
             "     is_revoked: BOOLEAN",
             title="user_sessions (1:N)", fill_color="#F8FAFC", border_color=BLUE, fontsize=7.5)

    # Table 4: locations
    draw_box(ax, 0.63, 0.58, 0.24, 0.28,
             "PK  id: UUID\n"
             "UQ  slug: VARCHAR(100)\n"
             "     name: VARCHAR(150)\n"
             "     category: VARCHAR(50)\n"
             "     latitude: DOUBLE (WGS84)\n"
             "     longitude: DOUBLE (WGS84)\n"
             "     is_verified: BOOLEAN\n"
             "     dataset_provenance: VARCHAR",
             title="locations (Campus POIs)", fill_color="#F8FAFC", border_color=GREEN, fontsize=7.5)

    # Table 5: nodes
    draw_box(ax, 0.94, 0.58, 0.22, 0.28,
             "PK  id: UUID\n"
             "UQ  node_code: VARCHAR(50)\n"
             "     name: VARCHAR(150)\n"
             "     latitude: DOUBLE PRECISION\n"
             "     longitude: DOUBLE PRECISION\n"
             "     node_type: VARCHAR(30)\n"
             "     is_accessible: BOOLEAN\n"
             "     is_active: BOOLEAN",
             title="nodes (Graph Waypoints)", fill_color="#F8FAFC", border_color=ACCENT, fontsize=7.5)

    # Table 6: edges
    draw_box(ax, 0.94, 0.18, 0.22, 0.26,
             "PK  id: UUID\n"
             "FK  source_node_id: UUID\n"
             "FK  target_node_id: UUID\n"
             "     distance_meters: FLOAT\n"
             "     path_type: VARCHAR(30)\n"
             "     is_accessible: BOOLEAN\n"
             "     is_bidirectional: BOOLEAN",
             title="edges (Walkway Segments)", fill_color="#F8FAFC", border_color=ACCENT, fontsize=7.5)

    # Table 7: audit_logs
    draw_box(ax, 0.05, 0.18, 0.24, 0.24,
             "PK  id: UUID\n"
             "     timestamp: TIMESTAMP\n"
             "     action: VARCHAR(100)\n"
             "     entity_type: VARCHAR(50)\n"
             "     entity_id: VARCHAR(100)\n"
             "     actor_email: VARCHAR(255)\n"
             "     ip_address: VARCHAR(45)\n"
             "     details: JSONB",
             title="audit_logs (Security Ledger)", fill_color="#F8FAFC", border_color=PURPLE, fontsize=7.5)

    # Table 8: location_reports
    draw_box(ax, 0.48, 0.18, 0.24, 0.24,
             "PK  id: UUID\n"
             "FK  user_id: UUID (Optional)\n"
             "FK  location_id: UUID (Optional)\n"
             "     issue_type: VARCHAR(50)\n"
             "     status: VARCHAR(30)\n"
             "     description: TEXT\n"
             "     resolution_notes: TEXT",
             title="location_reports (Assistance)", fill_color="#F8FAFC", border_color="#0D9488", fontsize=7.5)

    # Relationships
    draw_arrow(ax, 0.27, 0.78, 0.34, 0.80, "1:1", color=BLUE)
    draw_arrow(ax, 0.27, 0.65, 0.34, 0.62, "1:N", color=BLUE)
    draw_arrow(ax, 0.16, 0.58, 0.16, 0.42, "1:N (Actor)", color=PURPLE)
    draw_arrow(ax, 0.27, 0.60, 0.48, 0.28, "1:N (Submitter)", color="#0D9488", rad=0.2)

    draw_arrow(ax, 0.63, 0.28, 0.68, 0.58, "1:N (Reported POI)", color="#0D9488", rad=-0.2)
    draw_arrow(ax, 0.87, 0.72, 0.94, 0.72, "1:1 (Entrance Node)", color=GREEN)
    draw_arrow(ax, 1.05, 0.58, 1.05, 0.44, "1:N (Source / Target)", color=ACCENT)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "entity_relationship_diagram.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 7: ACTIVITY DIAGRAM (ROUTE GENERATION)
# ==============================================================================
def generate_activity_diagram():
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.5, 0.96, "Figure 7: UML Activity Diagram - Route Generation & Live Wayfinding", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.5, 0.92, "Control Flow for Dynamic Snapping, Path Relaxation, and Off-Route Rerouting", ha="center", fontsize=8.5, color="#64748B")

    # Initial Node
    circle = Circle((0.5, 0.88), 0.015, color=NAVY, zorder=3)
    ax.add_patch(circle)
    ax.text(0.5, 0.85, "User Selects Destination / Scans QR", ha="center", fontsize=8, color=NAVY)

    draw_box(ax, 0.35, 0.74, 0.30, 0.08, "Evaluate Starting Position\n(Snapped GPS or Manual Gate)", fill_color=LIGHT_BLUE, border_color=BLUE)
    draw_box(ax, 0.35, 0.60, 0.30, 0.08, "Check Route Cache\n(_ROUTE_CACHE / 5-min TTL)", fill_color=LIGHT_AMBER, border_color=AMBER)
    draw_box(ax, 0.35, 0.46, 0.30, 0.08, "Execute Dijkstra / A* Solver\n(Priority Queue Relaxation)", fill_color=LIGHT_GREEN, border_color=GREEN)
    draw_box(ax, 0.35, 0.32, 0.30, 0.08, "Calculate Turn HUD Bearings\n& Walking Duration (1.3 m/s)", fill_color=LIGHT_PURPLE, border_color=PURPLE)
    draw_box(ax, 0.35, 0.18, 0.30, 0.08, "Render Map Polyline &\nTrack Real-Time Movement", fill_color="#F8FAFC", border_color=NAVY)

    # Decision Diamond: Off-Route Check
    draw_box(ax, 0.70, 0.18, 0.26, 0.08, "[Decision]\nDrift > 25m off route?", fill_color="#FEE2E2", border_color=ACCENT, fontsize=8)

    # Activity End
    circle_out = Circle((0.5, 0.05), 0.018, ec=NAVY, fc="none", lw=1.5, zorder=3)
    circle_in = Circle((0.5, 0.05), 0.011, color=NAVY, zorder=4)
    ax.add_patch(circle_out)
    ax.add_patch(circle_in)
    ax.text(0.5, 0.015, "Destination Reached", ha="center", fontsize=8, color=NAVY)

    # Arrows
    draw_arrow(ax, 0.5, 0.86, 0.5, 0.82, color=NAVY)
    draw_arrow(ax, 0.5, 0.74, 0.5, 0.68, color=NAVY)
    draw_arrow(ax, 0.5, 0.60, 0.5, 0.54, color=NAVY)
    draw_arrow(ax, 0.5, 0.46, 0.5, 0.40, color=NAVY)
    draw_arrow(ax, 0.5, 0.32, 0.5, 0.26, color=NAVY)
    draw_arrow(ax, 0.65, 0.22, 0.70, 0.22, "Monitor GPS", color=NAVY)
    draw_arrow(ax, 0.83, 0.26, 0.50, 0.46, "Yes: Auto-Reroute", color=ACCENT, rad=0.4)
    draw_arrow(ax, 0.50, 0.18, 0.50, 0.08, "No: Continue Navigation", color=GREEN)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "activity_diagram.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 8: SEQUENCE DIAGRAM (AUTHENTICATION)
# ==============================================================================
def generate_sequence_diagram_auth():
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.5, 0.96, "Figure 8: UML Sequence Diagram - Dual-Mode Authentication Pipeline", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.5, 0.92, "Cryptographic Sign-In with Argon2id Verification and SHA-256 Hashed Session Persistence", ha="center", fontsize=8.5, color="#64748B")

    # Lifelines
    cols = [0.12, 0.35, 0.62, 0.88]
    names = ["Client / Browser", "FastAPI /auth/login", "SecurityManager", "Database (Neon)"]
    for c, n in zip(cols, names):
        draw_box(ax, c - 0.10, 0.82, 0.20, 0.06, n, fill_color="#F1F5F9", border_color=NAVY, fontsize=8)
        line = mlines.Line2D([c, c], [0.10, 0.82], color="#94A3B8", ls="--", lw=1)
        ax.add_line(line)

    # Sequence Messages
    y_steps = [0.74, 0.65, 0.56, 0.47, 0.38, 0.29, 0.20, 0.12]

    # 1. POST Login
    draw_arrow(ax, cols[0], y_steps[0], cols[1], y_steps[0], "1: POST /api/v1/auth/login {email, pwd}", color=BLUE)
    # 2. Query user & creds
    draw_arrow(ax, cols[1], y_steps[1], cols[3], y_steps[1], "2: SELECT user, password_hash", color=NAVY)
    draw_arrow(ax, cols[3], y_steps[2], cols[1], y_steps[2], "3: UserProfile + Argon2id Hash", color=NAVY)
    # 3. Verify password
    draw_arrow(ax, cols[1], y_steps[3], cols[2], y_steps[3], "4: verify_password(plain, hash)", color=PURPLE)
    draw_arrow(ax, cols[2], y_steps[4], cols[1], y_steps[4], "5: True (Argon2id match)", color=PURPLE)
    # 4. Generate token pair
    draw_arrow(ax, cols[1], y_steps[5], cols[2], y_steps[5], "6: generate_token_pair() -> raw, hash", color=AMBER)
    # 5. Insert session
    draw_arrow(ax, cols[1], y_steps[6], cols[3], y_steps[6], "7: INSERT user_sessions (token_hash)", color=GREEN)
    # 6. Response
    draw_arrow(ax, cols[1], y_steps[7], cols[0], y_steps[7], "8: HTTP 200 + Set-Cookie: campusway_session", color=ACCENT)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "sequence_diagram_auth.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 9: SEQUENCE DIAGRAM (ROUTING)
# ==============================================================================
def generate_sequence_diagram_routing():
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.5, 0.96, "Figure 9: UML Sequence Diagram - Shortest-Path Route Calculation", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.5, 0.92, "Interactive Route Request, In-Memory Caching, Dijkstra Solver, and Vector Render", ha="center", fontsize=8.5, color="#64748B")

    cols = [0.12, 0.37, 0.63, 0.88]
    names = ["Explore Client", "FastAPI /routing", "Pathfinding Solver", "Topology Store"]
    for c, n in zip(cols, names):
        draw_box(ax, c - 0.10, 0.82, 0.20, 0.06, n, fill_color="#F1F5F9", border_color=NAVY, fontsize=8)
        line = mlines.Line2D([c, c], [0.10, 0.82], color="#94A3B8", ls="--", lw=1)
        ax.add_line(line)

    y_steps = [0.74, 0.65, 0.56, 0.47, 0.38, 0.29, 0.20, 0.12]

    draw_arrow(ax, cols[0], y_steps[0], cols[1], y_steps[0], "1: GET /api/v1/routing/route?orig={A}&dest={B}", color=BLUE)
    draw_arrow(ax, cols[1], y_steps[1], cols[3], y_steps[1], "2: get_active_graph() [nodes, edges]", color=AMBER)
    draw_arrow(ax, cols[3], y_steps[2], cols[1], y_steps[2], "3: CampusGraph Adjacency List", color=AMBER)
    draw_arrow(ax, cols[1], y_steps[3], cols[2], y_steps[3], "4: find_shortest_path(orig, dest, accessible)", color=ACCENT)
    draw_arrow(ax, cols[2], y_steps[4], cols[2], y_steps[4], "5: heapq relaxation loop O((V+E) log V)", color=ACCENT, rad=0.2)
    draw_arrow(ax, cols[2], y_steps[5], cols[1], y_steps[5], "6: Node path list + Edge segments", color=GREEN)
    draw_arrow(ax, cols[1], y_steps[6], cols[1], y_steps[6], "7: generate_step_directions() -> Turn HUD", color=PURPLE, rad=0.2)
    draw_arrow(ax, cols[1], y_steps[7], cols[0], y_steps[7], "8: HTTP 200 OK RouteResponse (Polyline, Steps)", color=NAVY)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "sequence_diagram_routing.png"), dpi=300)
    plt.close()

# ==============================================================================
# FIGURE 10: STATE MACHINE DIAGRAM (GPS SNAPPING & REROUTING)
# ==============================================================================
def generate_state_diagram_gps():
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(BG_COLOR)

    ax.text(0.5, 0.96, "Figure 10: UML State Machine Diagram - GPS Positioning & Dynamic Snapping", ha="center", fontsize=12, fontweight="bold", color=NAVY)
    ax.text(0.5, 0.92, "Finite State Lifecycle of Pedestrian Device Coordinates within Campus Graph Bounds", ha="center", fontsize=8.5, color="#64748B")

    # States
    draw_box(ax, 0.08, 0.70, 0.20, 0.12, "Browser watchPosition\nwaiting for signal", title="STATE: IDLE", fill_color="#F8FAFC", border_color="#64748B")
    draw_box(ax, 0.40, 0.70, 0.20, 0.12, "accuracy > 50m\n(Pulsing Amber HUD)", title="STATE: LOW_ACCURACY", fill_color=LIGHT_AMBER, border_color=AMBER)
    draw_box(ax, 0.72, 0.70, 0.20, 0.12, "Coordinates outside\nLPU Boundary Box", title="STATE: OUT_OF_BOUNDS", fill_color="#FEE2E2", border_color="#DC2626")

    draw_box(ax, 0.08, 0.36, 0.22, 0.14, "Inside campus, but\n>75m from survey node\n(3 Nearest Landmarks)", title="STATE: UNSURVEYED_AREA", fill_color=LIGHT_PURPLE, border_color=PURPLE)
    draw_box(ax, 0.40, 0.36, 0.22, 0.14, "Snapped to nearest\nNode ID (Dist <= 75m)\n(Blue Dot Marker)", title="STATE: SNAPPED_TO_GRAPH", fill_color=LIGHT_GREEN, border_color=GREEN)
    draw_box(ax, 0.72, 0.36, 0.22, 0.14, "Active route polyline,\nTurn-by-turn guidance", title="STATE: NAVIGATING", fill_color=LIGHT_BLUE, border_color=BLUE)

    draw_box(ax, 0.56, 0.10, 0.24, 0.12, "User drifted > 25m\nRecomputing route", title="STATE: OFF_ROUTE_REROUTING", fill_color="#FEE2E2", border_color=ACCENT)

    # Transitions
    draw_arrow(ax, 0.28, 0.76, 0.40, 0.76, "GPS event received", color=NAVY)
    draw_arrow(ax, 0.50, 0.70, 0.50, 0.50, "accuracy <= 50m", color=GREEN)
    draw_arrow(ax, 0.60, 0.76, 0.72, 0.76, "Outside campus lat/lng", color="#DC2626")

    draw_arrow(ax, 0.40, 0.43, 0.30, 0.43, "Dist to nearest node > 75m", color=PURPLE)
    draw_arrow(ax, 0.30, 0.39, 0.40, 0.39, "Re-enters 75m corridor", color=GREEN)

    draw_arrow(ax, 0.62, 0.43, 0.72, 0.43, "User starts route", color=BLUE)
    draw_arrow(ax, 0.83, 0.36, 0.75, 0.22, "Off-route drift > 25m", color=ACCENT)
    draw_arrow(ax, 0.68, 0.22, 0.76, 0.36, "Updated route calculated", color=GREEN)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "state_diagram_gps.png"), dpi=300)
    plt.close()

if __name__ == "__main__":
    print("Generating SRS diagrams...")
    generate_dfd_level_0()
    print("✓ Figure 1: DFD Level 0 generated.")
    generate_dfd_level_1()
    print("✓ Figure 2: DFD Level 1 generated.")
    generate_dfd_level_2()
    print("✓ Figure 3: DFD Level 2 generated.")
    generate_use_case_diagram()
    print("✓ Figure 4: Use Case Diagram generated.")
    generate_system_architecture()
    print("✓ Figure 5: System Architecture Diagram generated.")
    generate_erd_diagram()
    print("✓ Figure 6: Entity-Relationship Diagram generated.")
    generate_activity_diagram()
    print("✓ Figure 7: Activity Diagram generated.")
    generate_sequence_diagram_auth()
    print("✓ Figure 8: Sequence Diagram (Auth) generated.")
    generate_sequence_diagram_routing()
    print("✓ Figure 9: Sequence Diagram (Routing) generated.")
    generate_state_diagram_gps()
    print("✓ Figure 10: State Machine Diagram (GPS) generated.")
    print("All 10 SRS diagrams successfully generated in scripts/diagrams/!")
