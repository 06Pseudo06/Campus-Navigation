"use client";

import React, { useState, useEffect, useMemo, useTransition, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CampusMap } from "@/components/dashboard/CampusMap";
import { DestinationPanel } from "@/components/dashboard/DestinationPanel";
import { RoutesTab } from "@/components/dashboard/RoutesTab";
import { SavedTab } from "@/components/dashboard/SavedTab";
import { HelpTab } from "@/components/dashboard/HelpTab";
import { CARLETON_DEMO_LOCATIONS } from "@/data/carletonLocations";
import { locationService } from "@/services/locationService";
import { routeService } from "@/services/routeService";
import { favoriteService } from "@/services/favoriteService";
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

  // Map display mode: always Carleton live demo
  const [mapDisplayMode, setMapDisplayMode] = useState<MapDisplayMode>("carleton_demo");

  // Initial campus locations & node cache
  const [locations, setLocations] = useState<CampusLocation[]>(CARLETON_DEMO_LOCATIONS);
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
  const defaultInitialOrigin = CARLETON_DEMO_LOCATIONS.find((l) => l.code === "ML") || CARLETON_DEMO_LOCATIONS[0];
  const defaultInitialDest = CARLETON_DEMO_LOCATIONS.find((l) => l.code === "PA") || CARLETON_DEMO_LOCATIONS[1];

  // Routing endpoints state
  const [originLocation, setOriginLocation] = useState<CampusLocation | null>(defaultInitialOrigin);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(defaultInitialDest);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"dijkstra" | "astar">("dijkstra");

  // Route preview state
  const [activeRoute, setActiveRoute] = useState<CampusRoute | null>(null);
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Saved location IDs & state (read strictly from guest storage without injecting fake bookmarks)
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
        // Authenticated user: fetch from PostgreSQL
        try {
          const userFavs = await favoriteService.getMyFavorites();
          const backendIds = userFavs.map((f) => f.location_id);

          // Check if guest has any unsaved bookmarks to safely migrate
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
        // Guest user: load from localStorage
        const guestIds = favoriteService.getGuestFavorites();
        setSavedIds(guestIds);
      }
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  // Sync favorites whenever user authentication state (ID) changes
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
  }, []);

  // 2. User-Driven Route Calculation Execution Method
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

      // Prevent concurrent execution: abort previous pending calculation
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
        // Resolve origin node ID
        let originNodeId = origin.nearestNodeId;
        if (!originNodeId) {
          const originNodes = await routeService.getNodesForLocation(origin.id, controller.signal);
          if (originNodes.length > 0) {
            originNodeId = originNodes[0].id;
          }
        }

        // Resolve destination node ID
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

        // Call backend shortest path calculation
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

        // Format into frontend route model with coordinate waypoints using cached nodeMap
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

  // 3. Load Live Campus Data & Graph Topology on Mount (Stable, isolated, and idempotent)
  const loadCampusData = useCallback(async () => {
    if (isFetchingLocationsRef.current) return;
    isFetchingLocationsRef.current = true;
    setIsLoadingLocations(true);
    setLocationsError(null);

    destinationsAbortControllerRef.current?.abort();
    const controller = new AbortController();
    destinationsAbortControllerRef.current = controller;

    try {
      // Parallel fetch: destinations and graph nodes
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
      }

      if (destResults.status === "fulfilled" && Array.isArray(destResults.value) && destResults.value.length > 0) {
        // Successfully fetched live Carleton database records
        const mappedLocations = destResults.value.map((card) =>
          locationService.mapDestinationToCampusLocation(card)
        );

        setLocations(mappedLocations);
        setMapDisplayMode("carleton_demo");

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
        // Fallback to canonical Carleton demonstration dataset
        setLocations(CARLETON_DEMO_LOCATIONS);
        setMapDisplayMode("carleton_demo");
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      setLocations(CARLETON_DEMO_LOCATIONS);
      setMapDisplayMode("carleton_demo");
    } finally {
      setIsLoadingLocations(false);
      isFetchingLocationsRef.current = false;
    }
  }, []);

  // Mount effect: Fetch campus data on mount, safe across React StrictMode
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

  // Handler: Selecting destination location from map or destination panel
  const handleSelectLocation = useCallback((loc: CampusLocation) => {
    setSelectedLocation(loc);
    setRouteError(null);

    // Invalidate active route if the destination is changed
    setActiveRoute((prev) => (prev && prev.toLocationId === loc.id ? prev : null));

    if (currentTab !== "explore") {
      setCurrentTab("explore");
    }
    setMobileDrawerOpen(false);
  }, [currentTab]);

  // Handler: Selecting origin location
  const handleSelectOriginLocation = useCallback((loc: CampusLocation) => {
    setOriginLocation(loc);
    setRouteError(null);

    // Invalidate active route if the origin is changed
    setActiveRoute((prev) => (prev && prev.fromLocationId === loc.id ? prev : null));
  }, []);

  // Handler: Manual calculate button click (Explicit user action)
  const handleManualCalculate = useCallback(() => {
    calculateRoutePath(originLocation, selectedLocation, selectedAlgorithm);
  }, [calculateRoutePath, originLocation, selectedLocation, selectedAlgorithm]);

  // Handler: Switching algorithm (Dijkstra vs A*)
  const handleSelectAlgorithm = useCallback((algo: "dijkstra" | "astar") => {
    setSelectedAlgorithm(algo);
  }, []);

  // Handler: Selecting a predefined route from Routes tab
  const handleSelectPredefinedRoute = useCallback((fromId: string, toId: string) => {
    const fromLoc = locations.find((l) => l.id === fromId);
    const toLoc = locations.find((l) => l.id === toId);

    if (fromLoc && toLoc) {
      setOriginLocation(fromLoc);
      setSelectedLocation(toLoc);
      setShowRoute(true);
      setCurrentTab("explore");
      calculateRoutePath(fromLoc, toLoc, selectedAlgorithm);
    }
  }, [locations, calculateRoutePath, selectedAlgorithm]);

  // Handler: Toggle bookmark for a location
  const handleToggleSaveLocation = async (locId: string) => {
    const isCurrentlySaved = savedIds.includes(locId);
    setSavedError(null);

    // Optimistic UI state update
    const previousSavedIds = savedIds;
    const nextSavedIds = isCurrentlySaved
      ? savedIds.filter((id) => id !== locId)
      : [...savedIds, locId];
    setSavedIds(nextSavedIds);

    try {
      if (user && user.id) {
        // Authenticated user: persist to PostgreSQL
        if (isCurrentlySaved) {
          await favoriteService.removeFavorite(user.id, locId);
        } else {
          await favoriteService.addFavorite(user.id, locId);
        }
      } else {
        // Guest user: persist to localStorage
        if (isCurrentlySaved) {
          favoriteService.removeGuestFavorite(locId);
        } else {
          favoriteService.addGuestFavorite(locId);
        }
      }
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setSavedIds(previousSavedIds);
      setSavedError(
        err instanceof Error ? err.message : "Failed to update bookmark in database."
      );
    }
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
                isAuthenticated={Boolean(user)}
                isLoading={isLoadingSaved}
                error={savedError}
              />
            </main>
          )}

          {currentTab === "help" && (
            <main className="flex-1 h-full overflow-y-auto">
              <HelpTab locations={locations} />
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
