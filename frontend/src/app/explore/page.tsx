"use client";

import React, { useState, useEffect, useMemo, useTransition, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ExploreUserMenu } from "@/components/explore/ExploreUserMenu";
import { ExploreToolbar } from "@/components/explore/ExploreToolbar";
import { ExploreRail } from "@/components/explore/ExploreRail";
import { ExploreStatsStrip } from "@/components/explore/ExploreStatsStrip";
import { ExploreMapCard } from "@/components/explore/ExploreMapCard";
import { ExploreRoutePanel } from "@/components/explore/ExploreRoutePanel";
import { ExploreRoutesView } from "@/components/explore/ExploreRoutesView";
import { ExploreSavedView } from "@/components/explore/ExploreSavedView";
import { ExploreHelpView } from "@/components/explore/ExploreHelpView";

import { CARLETON_DEMO_LOCATIONS } from "@/data/carletonLocations";
import { locationService } from "@/services/locationService";
import { routeService } from "@/services/routeService";
import { favoriteService } from "@/services/favoriteService";
import {
  CampusLocation,
  CampusRoute,
  SidebarTab,
} from "@/types/campus";
import { NodeRead } from "@/types/api";

export default function ExploreDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [, startTransition] = useTransition();

  // Active navigation tab: explore | routes | saved | help
  const [currentTab, setCurrentTab] = useState<SidebarTab>("explore");

  // Mobile sheet snap height: "peek" (112px) | "half" (55svh) | "full" (92svh)
  const [mobileSheetSnap, setMobileSheetSnap] = useState<"peek" | "half" | "full">("peek");

  // Global search & filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Campus locations & graph nodes
  const [locations, setLocations] = useState<CampusLocation[]>(CARLETON_DEMO_LOCATIONS);
  const [vertexCount, setVertexCount] = useState<number>(1957);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Caches & request management refs
  const nodeMapRef = useRef<Map<string, NodeRead>>(new Map());
  const destinationsAbortControllerRef = useRef<AbortController | null>(null);
  const isFetchingLocationsRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);
  const routeAbortControllerRef = useRef<AbortController | null>(null);
  const routeRequestIdRef = useRef<number>(0);
  const isCalculatingRouteRef = useRef<boolean>(false);

  // Default origin (MacOdrum Library - ML) and destination (Paterson Hall - PA)
  const defaultInitialOrigin =
    CARLETON_DEMO_LOCATIONS.find((l) => l.code === "ML") || CARLETON_DEMO_LOCATIONS[0];
  const defaultInitialDest =
    CARLETON_DEMO_LOCATIONS.find((l) => l.code === "PA") || CARLETON_DEMO_LOCATIONS[1];

  // Routing endpoints state
  const [originLocation, setOriginLocation] = useState<CampusLocation | null>(defaultInitialOrigin);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(defaultInitialDest);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"dijkstra" | "astar">("dijkstra");

  // Route preview state
  const [activeRoute, setActiveRoute] = useState<CampusRoute | null>(null);
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);

  // Saved location IDs & state
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return favoriteService.getGuestFavorites();
    }
    return [];
  });
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  // Success toast for OAuth redirect (?auth=success)
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  // Load and synchronize user or guest favorites
  const loadFavorites = useCallback(async (currentUser: typeof user) => {
    setIsLoadingSaved(true);
    setSavedError(null);
    try {
      if (currentUser && currentUser.id) {
        try {
          const userFavs = await favoriteService.getMyFavorites();
          const backendIds = userFavs.map((f) => f.location_id);
          const guestIds = favoriteService.getGuestFavorites();
          if (guestIds.length > 0) {
            const merged = await favoriteService.syncGuestFavoritesToUser(currentUser.id, backendIds);
            setSavedIds(merged);
          } else {
            setSavedIds(backendIds);
          }
        } catch (err: unknown) {
          const guestIds = favoriteService.getGuestFavorites();
          setSavedIds(guestIds);
          setSavedError(err instanceof Error ? err.message : "Failed to load saved favorites from server.");
        }
      } else {
        const guestIds = favoriteService.getGuestFavorites();
        setSavedIds(guestIds);
      }
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  const userId = user?.id;
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        loadFavorites(user);
      }
    });
    return () => {
      active = false;
    };
  }, [userId, user, loadFavorites]);

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
    const tabParam = params.get("tab");
    if (tabParam === "routes" || tabParam === "saved" || tabParam === "help") {
      queueMicrotask(() => {
        setCurrentTab(tabParam as SidebarTab);
      });
    }
  }, []);

  // Route calculation execution
  const calculateRoutePath = useCallback(
    async (
      origin: CampusLocation | null,
      destination: CampusLocation | null,
      algo: "dijkstra" | "astar" = "dijkstra"
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

      if (isCalculatingRouteRef.current) {
        routeAbortControllerRef.current?.abort();
      }

      const controller = new AbortController();
      routeAbortControllerRef.current = controller;
      const requestId = ++routeRequestIdRef.current;

      setIsCalculatingRoute(true);
      isCalculatingRouteRef.current = true;
      setRouteError(null);

      try {
        let originNodeId = origin.nearestNodeId;
        if (!originNodeId) {
          const originNodes = await routeService.getNodesForLocation(origin.id, controller.signal);
          if (originNodes.length > 0) {
            originNodeId = originNodes[0].id;
          }
        }

        let destinationNodeId = destination.nearestNodeId;
        if (!destinationNodeId) {
          const destNodes = await routeService.getNodesForLocation(destination.id, controller.signal);
          if (destNodes.length > 0) {
            destinationNodeId = destNodes[0].id;
          }
        }

        if (controller.signal.aborted || requestId !== routeRequestIdRef.current) {
          return;
        }

        if (!originNodeId || !destinationNodeId) {
          throw new Error("Unable to identify active navigation nodes for the selected locations.");
        }

        const routeResp = await routeService.calculateRoute(
          originNodeId,
          destinationNodeId,
          false,
          algo,
          controller.signal
        );

        if (controller.signal.aborted || requestId !== routeRequestIdRef.current) {
          return;
        }

        const formattedRoute = routeService.formatRouteModel(
          origin,
          destination,
          routeResp,
          nodeMapRef.current
        );

        setActiveRoute(formattedRoute);
        setShowRoute(true);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
        if (requestId === routeRequestIdRef.current) {
          const message =
            err instanceof Error
              ? err.message
              : "No viable pedestrian pathway could be calculated between the selected buildings.";
          setRouteError(message);
          setActiveRoute(null);
        }
      } finally {
        if (requestId === routeRequestIdRef.current) {
          setIsCalculatingRoute(false);
          isCalculatingRouteRef.current = false;
        }
      }
    },
    []
  );

  // Load Live Campus Data & Graph Topology on Mount
  const loadCampusData = useCallback(async () => {
    if (isFetchingLocationsRef.current) return;
    isFetchingLocationsRef.current = true;
    setIsLoadingLocations(true);
    setLocationsError(null);

    destinationsAbortControllerRef.current?.abort();
    const controller = new AbortController();
    destinationsAbortControllerRef.current = controller;

    try {
      const [destResults, nodeResults] = await Promise.allSettled([
        locationService.getVisitorDestinations(undefined, undefined, 60, controller.signal),
        routeService.getAllNodes(controller.signal),
      ]);

      if (controller.signal.aborted) return;

      let loadedNodes: NodeRead[] = [];
      const newNodeMap = new Map<string, NodeRead>();
      if (nodeResults.status === "fulfilled" && Array.isArray(nodeResults.value)) {
        loadedNodes = nodeResults.value;
        loadedNodes.forEach((node) => newNodeMap.set(node.id, node));
        nodeMapRef.current = newNodeMap;
        setVertexCount(newNodeMap.size || 1957);
      }

      if (
        destResults.status === "fulfilled" &&
        Array.isArray(destResults.value) &&
        destResults.value.length > 0
      ) {
        const mappedLocations = destResults.value.map((card) =>
          locationService.mapDestinationToCampusLocation(card)
        );

        setLocations(mappedLocations);

        const defaultOrigin =
          mappedLocations.find(
            (l) => l.code === "ML" || l.name.toLowerCase().includes("library")
          ) || mappedLocations[0];

        const defaultDest =
          mappedLocations.find(
            (l) => l.code === "PA" || l.name.toLowerCase().includes("paterson")
          ) || mappedLocations[1] || mappedLocations[0];

        setOriginLocation((prev) => prev || defaultOrigin);
        setSelectedLocation((prev) => prev || defaultDest);
      } else {
        setLocations(CARLETON_DEMO_LOCATIONS);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      setLocations(CARLETON_DEMO_LOCATIONS);
    } finally {
      setIsLoadingLocations(false);
      isFetchingLocationsRef.current = false;
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        loadCampusData().then(() => {
          if (!isCancelled) {
            hasInitializedRef.current = true;
          }
        });
      }
    });

    return () => {
      isCancelled = true;
      destinationsAbortControllerRef.current?.abort();
      routeAbortControllerRef.current?.abort();
    };
  }, [loadCampusData]);

  // Handlers
  const handleSelectLocation = useCallback(
    (loc: CampusLocation) => {
      setSelectedLocation(loc);
      setRouteError(null);
      setActiveRoute((prev) => (prev && prev.toLocationId === loc.id ? prev : null));

      if (currentTab !== "explore") {
        setCurrentTab("explore");
      }
      setMobileSheetSnap("peek");
    },
    [currentTab]
  );

  const handleSelectOriginLocation = useCallback((loc: CampusLocation) => {
    setOriginLocation(loc);
    setRouteError(null);
    setActiveRoute((prev) => (prev && prev.fromLocationId === loc.id ? prev : null));
  }, []);

  const handleManualCalculate = useCallback(() => {
    calculateRoutePath(originLocation, selectedLocation, selectedAlgorithm);
  }, [calculateRoutePath, originLocation, selectedLocation, selectedAlgorithm]);

  const handleSelectAlgorithm = useCallback((algo: "dijkstra" | "astar") => {
    setSelectedAlgorithm(algo);
  }, []);

  const handleSelectPredefinedRoute = useCallback(
    (fromId: string, toId: string) => {
      const fromLoc = locations.find((l) => l.id === fromId);
      const toLoc = locations.find((l) => l.id === toId);

      if (fromLoc && toLoc) {
        setOriginLocation(fromLoc);
        setSelectedLocation(toLoc);
        setShowRoute(true);
        setCurrentTab("explore");
        calculateRoutePath(fromLoc, toLoc, selectedAlgorithm);
      }
    },
    [locations, calculateRoutePath, selectedAlgorithm]
  );

  const handleToggleSaveLocation = async (locId: string) => {
    const isCurrentlySaved = savedIds.includes(locId);
    setSavedError(null);

    const previousSavedIds = savedIds;
    const nextSavedIds = isCurrentlySaved
      ? savedIds.filter((id) => id !== locId)
      : [...savedIds, locId];
    setSavedIds(nextSavedIds);

    try {
      if (user && user.id) {
        if (isCurrentlySaved) {
          await favoriteService.removeFavorite(user.id, locId);
        } else {
          await favoriteService.addFavorite(user.id, locId);
        }
      } else {
        if (isCurrentlySaved) {
          favoriteService.removeGuestFavorite(locId);
        } else {
          favoriteService.addGuestFavorite(locId);
        }
      }
    } catch (err: unknown) {
      setSavedIds(previousSavedIds);
      setSavedError(
        err instanceof Error ? err.message : "Failed to update bookmark in database."
      );
    }
  };

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

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F7F3EC] text-[#111111]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8542F] p-3 flex items-center justify-center shadow-xl shadow-[#E8542F]/20 animate-pulse">
            <div className="w-8 h-8 rounded-t-full border-[2.5px] border-white border-b-0 flex items-end justify-center pb-0.5">
              <div className="w-3 h-4 rounded-t-full border-[2px] border-white border-b-0" />
            </div>
          </div>
          <div className="text-center font-mono">
            <h2 className="text-base font-bold text-[#111111] uppercase tracking-wider">
              CampusWay Atlas
            </h2>
            <p className="text-xs text-[#5B5750] mt-1 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E8542F] animate-ping" />
              <span>Verifying session &bull; Initializing graph engine…</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F7F3EC] text-[#111111] flex flex-col select-none">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* 1. Top Fixed Editorial Navbar (72px) with User Chip */}
      <div className="h-[72px] shrink-0">
        <EditorialNavbar
          isFixedApp={true}
          rightSlot={<ExploreUserMenu />}
        />
      </div>

      {/* 2. Editorial Toolbar Row (88px) */}
      <ExploreToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        campusName="Carleton University"
        isDemoData={true}
      />

      {/* Auth Success Toast */}
      {authSuccessToast && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs font-mono flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>
              {authSuccessToast} Signed in as <b>{user?.name || user?.email || "Student"}</b>.
            </span>
          </div>
          <button
            onClick={() => setAuthSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3. Main Working Zone (100svh - 160px) */}
      <div className="flex-1 flex overflow-hidden p-3 sm:p-4 lg:p-5 gap-4 lg:gap-5 relative">
        {/* Left Icon Rail (72px collapsed, 220px expanded overlay on desktop) */}
        <ExploreRail
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          savedCount={savedIds.length}
        />

        {/* Dynamic Center/Right Area by Tab */}
        {currentTab === "explore" && (
          <div className="flex-1 flex gap-4 lg:gap-5 min-w-0 h-full overflow-hidden">
            {/* Center Map Card + Stats Strip Column */}
            <main
              className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
              aria-label="Campus Interactive Map"
            >
              {/* Map Card */}
              <div className="flex-1 min-w-0 h-full overflow-hidden relative">
                <ExploreMapCard
                  locations={displayedLocations}
                  selectedLocation={selectedLocation}
                  originLocation={originLocation}
                  onSelectLocation={handleSelectLocation}
                  onSelectOriginLocation={handleSelectOriginLocation}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                  hoveredStepIndex={hoveredStepIndex}
                />
              </div>

              {/* Stats Strip under map */}
              <ExploreStatsStrip
                buildingCount={locations.length}
                vertexCount={vertexCount}
                walkwayCount={124}
                latencyMs={1.8}
                algorithm={selectedAlgorithm}
              />
            </main>

            {/* Right Desktop Route Panel (400px) */}
            <div className="hidden lg:block h-full">
              <ExploreRoutePanel
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
                hoveredStepIndex={hoveredStepIndex}
                onHoverStep={setHoveredStepIndex}
              />
            </div>

            {/* Mobile / Tablet Bottom Sheet (< 1024px) */}
            <div
              className={`lg:hidden fixed inset-x-0 bottom-16 z-50 transition-all duration-300 ease-out flex flex-col bg-[#FBF8F2] border-t border-[#111111]/15 shadow-2xl rounded-t-[28px] overflow-hidden ${
                mobileSheetSnap === "peek"
                  ? "h-28"
                  : mobileSheetSnap === "half"
                  ? "h-[55svh]"
                  : "h-[90svh]"
              }`}
            >
              {/* Draggable Handle */}
              <div
                onClick={() =>
                  setMobileSheetSnap((prev) =>
                    prev === "peek" ? "half" : prev === "half" ? "full" : "peek"
                  )
                }
                className="w-full py-2.5 flex items-center justify-center cursor-pointer bg-[#FBF8F2] border-b border-[#111111]/08"
                aria-label="Toggle drawer height"
              >
                <div className="w-12 h-1.5 rounded-full bg-[#111111]/20 hover:bg-[#E8542F] transition-colors" />
              </div>

              <div className="flex-1 overflow-hidden">
                <ExploreRoutePanel
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
                  hoveredStepIndex={hoveredStepIndex}
                  onHoverStep={setHoveredStepIndex}
                  isMobileDrawer={true}
                  onCloseMobileDrawer={() => setMobileSheetSnap("peek")}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === "routes" && (
          <main className="flex-1 h-full rounded-[28px] bg-[#F7F3EC] border border-[#111111]/12 overflow-hidden shadow-xs">
            <ExploreRoutesView
              locations={locations}
              onSelectRoute={handleSelectPredefinedRoute}
            />
          </main>
        )}

        {currentTab === "saved" && (
          <main className="flex-1 h-full rounded-[28px] bg-[#F7F3EC] border border-[#111111]/12 overflow-hidden shadow-xs">
            <ExploreSavedView
              savedLocations={savedLocationsList}
              onSelectLocation={handleSelectLocation}
              onRemoveSaved={handleToggleSaveLocation}
              isAuthenticated={Boolean(user)}
              isLoading={isLoadingSaved}
              error={savedError}
            />
          </main>
        )}

        {currentTab === "help" && (
          <main className="flex-1 h-full rounded-[28px] bg-[#F7F3EC] border border-[#111111]/12 overflow-hidden shadow-xs">
            <ExploreHelpView locations={locations} />
          </main>
        )}
      </div>
    </div>
  );
}