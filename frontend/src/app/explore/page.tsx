"use client";

import React, { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CampusMap } from "@/components/dashboard/CampusMap";
import { DestinationPanel } from "@/components/dashboard/DestinationPanel";
import { RoutesTab } from "@/components/dashboard/RoutesTab";
import { SavedTab } from "@/components/dashboard/SavedTab";
import { HelpTab } from "@/components/dashboard/HelpTab";
import { SAMPLE_LOCATIONS } from "@/data/campusData";
import { locationService } from "@/services/locationService";
import { routeService } from "@/services/routeService";
import {
  CampusLocation,
  CampusRoute,
  SidebarTab,
  MapDisplayMode,
} from "@/types/campus";
import { NodeRead } from "@/types/api";
import { Spinner, CampusWayLogo } from "@/components/icons/Icons";

export default function ExploreDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [, startTransition] = useTransition();

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<SidebarTab>("explore");

  // Mobile menu / drawer controls
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Global search & filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Map display mode: defaults to live Carleton GPS projection
  const [mapDisplayMode, setMapDisplayMode] = useState<MapDisplayMode>("carleton_demo");

  // Live campus locations & node cache
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [nodeMap, setNodeMap] = useState<Map<string, NodeRead>>(new Map());

  // Routing endpoints state
  const [originLocation, setOriginLocation] = useState<CampusLocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"dijkstra" | "astar">("dijkstra");

  // Route preview state
  const [activeRoute, setActiveRoute] = useState<CampusRoute | null>(null);
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Saved location IDs
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Success toast for OAuth redirect (?auth=success)
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  // 1. Session verification (Non-blocking: supports both guest visitors and authenticated users)
  // Public wayfinding is accessible to everyone; authenticated users have their identity shown in Topbar.


  // Check URL search parameters on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      let timer: NodeJS.Timeout;
      queueMicrotask(() => {
        setAuthSuccessToast("Successfully authenticated with Google OAuth!");
        timer = setTimeout(() => {
          setAuthSuccessToast(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 4500);
      });
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, []);

  // 2. Route Calculation Execution Method
  const calculateRoutePath = useCallback(
    async (
      origin: CampusLocation | null,
      destination: CampusLocation | null,
      algo: "dijkstra" | "astar" = "dijkstra",
      currentNodeMap?: Map<string, NodeRead>
    ) => {
      if (!origin || !destination) {
        setActiveRoute(null);
        return;
      }

      if (origin.id === destination.id) {
        setRouteError("Origin and destination cannot be the same building.");
        setActiveRoute(null);
        return;
      }

      // Check topology coverage
      if (origin.hasRouteTopology === false) {
        setRouteError(
          `Routing topology unavailable: Origin "${origin.name}" access connection requires verification.`
        );
        setActiveRoute(null);
        return;
      }

      if (destination.hasRouteTopology === false) {
        setRouteError(
          `Routing topology unavailable: Destination "${destination.name}" access connection requires verification.`
        );
        setActiveRoute(null);
        return;
      }

      setIsCalculatingRoute(true);
      setRouteError(null);

      try {
        // Resolve origin node ID
        let originNodeId = origin.nearestNodeId;
        if (!originNodeId) {
          const originNodes = await routeService.getNodesForLocation(origin.id);
          if (originNodes.length > 0) {
            originNodeId = originNodes[0].id;
          }
        }

        // Resolve destination node ID
        let destinationNodeId = destination.nearestNodeId;
        if (!destinationNodeId) {
          const destNodes = await routeService.getNodesForLocation(destination.id);
          if (destNodes.length > 0) {
            destinationNodeId = destNodes[0].id;
          }
        }

        if (!originNodeId || !destinationNodeId) {
          throw new Error("Unable to identify active navigation nodes for the selected locations.");
        }

        // Call backend shortest path calculation
        const routeResp = await routeService.calculateRoute(
          originNodeId,
          destinationNodeId,
          false,
          algo
        );

        // Format into frontend route model with coordinate waypoints
        const effectiveNodeMap = currentNodeMap || nodeMap;
        const formattedRoute = routeService.formatRouteModel(
          origin,
          destination,
          routeResp,
          effectiveNodeMap
        );

        setActiveRoute(formattedRoute);
        setShowRoute(true);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "No viable pedestrian pathway could be calculated between the selected buildings.";
        setRouteError(message);
        setActiveRoute(null);
      } finally {
        setIsCalculatingRoute(false);
      }
    },
    [nodeMap]
  );

  // 3. Load Live Campus Data & Graph Topology on Mount
  const loadCampusData = useCallback(async () => {
    setIsLoadingLocations(true);
    setLocationsError(null);

    try {
      // Parallel fetch: destinations and graph nodes
      const [destResults, nodeResults] = await Promise.allSettled([
        locationService.getVisitorDestinations(undefined, undefined, 60),
        routeService.getAllNodes(),
      ]);

      let loadedNodes: NodeRead[] = [];
      const newNodeMap = new Map<string, NodeRead>();
      if (nodeResults.status === "fulfilled" && Array.isArray(nodeResults.value)) {
        loadedNodes = nodeResults.value;
        loadedNodes.forEach((node) => newNodeMap.set(node.id, node));
        setNodeMap(newNodeMap);
      }

      if (destResults.status === "fulfilled" && Array.isArray(destResults.value) && destResults.value.length > 0) {
        // Successfully fetched live Carleton database records
        const mappedLocations = destResults.value.map((card) =>
          locationService.mapDestinationToCampusLocation(card)
        );

        setLocations(mappedLocations);
        setMapDisplayMode("carleton_demo");

        // Identify default origin: MacOdrum Library (ML)
        const defaultOrigin =
          mappedLocations.find(
            (l) => l.code === "ML" || l.name.toLowerCase().includes("library")
          ) || mappedLocations[0];

        // Identify default destination: Paterson Hall (PA)
        const defaultDest =
          mappedLocations.find(
            (l) => l.code === "PA" || l.name.toLowerCase().includes("paterson")
          ) || mappedLocations[1] || mappedLocations[0];

        setOriginLocation(defaultOrigin);
        setSelectedLocation(defaultDest);

        // Pre-save default library bookmark
        if (defaultOrigin) {
          setSavedIds([defaultOrigin.id]);
        }

        // Calculate initial route between default pair
        if (defaultOrigin && defaultDest && defaultOrigin.id !== defaultDest.id) {
          calculateRoutePath(defaultOrigin, defaultDest, selectedAlgorithm, newNodeMap);
        }
      } else {
        // Fallback to offline blueprint concept
        setLocations(SAMPLE_LOCATIONS);
        setMapDisplayMode("lpu_concept");
        setLocationsError(
          "Live backend unreachable or empty. Displaying offline campus blueprint preview."
        );
        const defaultOrigin = SAMPLE_LOCATIONS[0];
        const defaultDest = SAMPLE_LOCATIONS.find((l) => l.id === "loc-block-34") || SAMPLE_LOCATIONS[1];
        setOriginLocation(defaultOrigin);
        setSelectedLocation(defaultDest);
        setSavedIds(["loc-block-34", "loc-library"]);
      }
    } catch {
      setLocations(SAMPLE_LOCATIONS);
      setMapDisplayMode("lpu_concept");
      setLocationsError(
        "Could not connect to live backend API. Switched to offline campus concept view."
      );
      const defaultOrigin = SAMPLE_LOCATIONS[0];
      const defaultDest = SAMPLE_LOCATIONS.find((l) => l.id === "loc-block-34") || SAMPLE_LOCATIONS[1];
      setOriginLocation(defaultOrigin);
      setSelectedLocation(defaultDest);
      setSavedIds(["loc-block-34", "loc-library"]);
    } finally {
      setIsLoadingLocations(false);
    }
  }, [calculateRoutePath, selectedAlgorithm]);

  useEffect(() => {
    loadCampusData();
  }, [loadCampusData]);

  // Handler: Selecting destination location from map or destination panel
  const handleSelectLocation = (loc: CampusLocation) => {
    setSelectedLocation(loc);
    setRouteError(null);

    // If valid origin is already set, calculate route
    if (originLocation && originLocation.id !== loc.id) {
      calculateRoutePath(originLocation, loc, selectedAlgorithm);
    } else {
      setActiveRoute(null);
    }

    if (currentTab !== "explore") {
      setCurrentTab("explore");
    }
    setMobileDrawerOpen(false);
  };

  // Handler: Selecting origin location
  const handleSelectOriginLocation = (loc: CampusLocation) => {
    setOriginLocation(loc);
    setRouteError(null);

    // If destination is already set, calculate route
    if (selectedLocation && selectedLocation.id !== loc.id) {
      calculateRoutePath(loc, selectedLocation, selectedAlgorithm);
    } else {
      setActiveRoute(null);
    }
  };

  // Handler: Manual calculate button click
  const handleManualCalculate = () => {
    calculateRoutePath(originLocation, selectedLocation, selectedAlgorithm);
  };

  // Handler: Switching algorithm (Dijkstra vs A*)
  const handleSelectAlgorithm = (algo: "dijkstra" | "astar") => {
    setSelectedAlgorithm(algo);
    if (originLocation && selectedLocation && originLocation.id !== selectedLocation.id) {
      calculateRoutePath(originLocation, selectedLocation, algo);
    }
  };

  // Handler: Selecting a predefined route from Routes tab
  const handleSelectPredefinedRoute = (fromId: string, toId: string) => {
    const fromLoc = locations.find((l) => l.id === fromId);
    const toLoc = locations.find((l) => l.id === toId);

    if (fromLoc && toLoc) {
      setOriginLocation(fromLoc);
      setSelectedLocation(toLoc);
      setShowRoute(true);
      setCurrentTab("explore");
      calculateRoutePath(fromLoc, toLoc, selectedAlgorithm);
    }
  };

  // Handler: Toggle bookmark for a location
  const handleToggleSaveLocation = (locId: string) => {
    setSavedIds((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  // Filter locations if search query is provided in topbar
  const displayedLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase().trim();
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q)
    );
  }, [locations, searchQuery]);

  const savedLocationsList = useMemo(() => {
    return locations.filter((l) => savedIds.includes(l.id));
  }, [locations, savedIds]);

  // If session is resolving, show a sleek dark loading state
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0f1d] text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DE4B31] to-[#992E1B] p-3 flex items-center justify-center shadow-2xl shadow-[#DE4B31]/30 animate-pulse">
            <CampusWayLogo className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-white tracking-wide">
              CampusWay
            </h2>
            <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-2">
              <Spinner className="w-3.5 h-3.5 text-[#DE4B31]" />
              <span>Verifying authenticated session...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isDemoActive = mapDisplayMode === "carleton_demo";

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0f1d] text-zinc-100 font-sans">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          startTransition(() => {
            setCurrentTab(tab);
          });
        }}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        savedCount={savedIds.length}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onToggleMobileDrawer={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          isMobileDrawerOpen={mobileDrawerOpen}
          campusName={isDemoActive ? "Carleton University" : "LPU Campus Concept"}
          isDemoData={isDemoActive}
        />

        {/* Auth success toast */}
        {authSuccessToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-2 text-xs flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {authSuccessToast} Signed in as <b>{user?.name || user?.email || "Student"}</b>.
              </span>
            </div>
            <button
              onClick={() => setAuthSuccessToast(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold px-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Body View */}
        <div className="flex-1 flex overflow-hidden relative">
          {currentTab === "explore" && (
            <>
              {/* Central Map Canvas */}
              <main
                className="flex-1 h-full min-w-0 relative"
                aria-label="Campus Interactive Map"
              >
                <CampusMap
                  locations={displayedLocations}
                  selectedLocation={selectedLocation}
                  originLocation={originLocation}
                  onSelectLocation={handleSelectLocation}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                  mapDisplayMode={mapDisplayMode}
                  onToggleMapMode={setMapDisplayMode}
                />
              </main>

              {/* Right Destination Panel (Desktop fixed, Tablet/Mobile responsive drawer) */}
              <div
                className={`lg:block ${
                  mobileDrawerOpen
                    ? "fixed inset-y-16 right-0 w-full sm:w-96 z-40 shadow-2xl block"
                    : "hidden lg:block"
                }`}
              >
                <DestinationPanel
                  locations={displayedLocations}
                  selectedLocation={selectedLocation}
                  originLocation={originLocation}
                  onSelectLocation={handleSelectLocation}
                  onSelectOriginLocation={handleSelectOriginLocation}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                  onToggleRoute={() => setShowRoute(!showRoute)}
                  onCalculateRoute={handleManualCalculate}
                  isCalculatingRoute={isCalculatingRoute}
                  routeError={routeError}
                  onClearRouteError={() => setRouteError(null)}
                  savedLocationIds={savedIds}
                  onToggleSaveLocation={handleToggleSaveLocation}
                  isLoadingLocations={isLoadingLocations}
                  locationsError={locationsError}
                  onRetryLocations={loadCampusData}
                  selectedAlgorithm={selectedAlgorithm}
                  onSelectAlgorithm={handleSelectAlgorithm}
                />
              </div>
            </>
          )}

          {currentTab === "routes" && (
            <main className="flex-1 h-full overflow-y-auto">
              <RoutesTab
                locations={locations}
                onSelectRoute={handleSelectPredefinedRoute}
              />
            </main>
          )}

          {currentTab === "saved" && (
            <main className="flex-1 h-full overflow-y-auto">
              <SavedTab
                savedLocations={savedLocationsList}
                onSelectLocation={handleSelectLocation}
                onRemoveSaved={handleToggleSaveLocation}
              />
            </main>
          )}

          {currentTab === "help" && (
            <main className="flex-1 h-full overflow-y-auto">
              <HelpTab />
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
