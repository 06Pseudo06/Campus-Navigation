"use client";

import React, { useState, useEffect, useMemo, useTransition, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CampusMapSkeleton } from "@/components/dashboard/CampusMapSkeleton";
import { DestinationPanel } from "@/components/dashboard/DestinationPanel";
import { RoutesTab } from "@/components/dashboard/RoutesTab";
import { SavedTab } from "@/components/dashboard/SavedTab";
import { HelpTab } from "@/components/dashboard/HelpTab";
import { mapBackendToFrontend } from "@/data/campusData";
import { locationService } from "@/services/locationService";
import { routeService } from "@/services/routeService";
import { CampusLocation, CampusRoute, SidebarTab } from "@/types/campus";
import { useDebounce } from "@/hooks/useDebounce";
import { useGeolocation } from "@/hooks/useGeolocation";
import { snapGpsToGraphNode, shouldRecomputeRoute } from "@/lib/gpsSnapping";
import { BackendNode } from "@/services/locationService";
import { MockLocationPanel } from "@/components/dashboard/MockLocationPanel";
import { parseNavigateParams, validateLocationIdentifier } from "@/lib/qrNavigation";
import { FEATURE_QR } from "@/lib/featureFlags";

// Lazy-load CampusMap (Mapbox GL) with zero-SSR to optimize initial page bundle and rendering
const CampusMap = dynamic(
  () => import("@/components/dashboard/CampusMap").then((m) => m.CampusMap),
  {
    ssr: false,
    loading: () => <CampusMapSkeleton />,
  }
);

// Lazy-load QR Scanner Modal
const QrScannerModal = dynamic(
  () => import("@/components/dashboard/QrScannerModal").then((m) => m.QrScannerModal),
  { ssr: false }
);

export default function ExploreDashboardPage() {
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  // GPS Location services
  const geo = useGeolocation();

  // GPS Origin & live re-routing state
  const [isOriginCurrentLocation, setIsOriginCurrentLocation] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const lastRoutedCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [backendNodes, setBackendNodes] = useState<BackendNode[]>([]);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Load graph nodes for snapping
  useEffect(() => {
    locationService.getNodes().then(setBackendNodes).catch(() => { });
  }, []);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<SidebarTab>("explore");

  // Mobile menu / drawer controls
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Global search & filter query (debounced by 250ms for smooth filtering)
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Dataset C locations loaded from the backend or verified survey fallback
  const [apiLocations, setApiLocations] = useState<CampusLocation[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const allLocations = apiLocations;

  // Starting point and destination selected from Dataset C
  const [originLocation, setOriginLocation] = useState<CampusLocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);

  // Route calculation state
  const [activeRoute, setActiveRoute] = useState<CampusRoute | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState<boolean>(true);

  // Bookmarked location IDs
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Success toast for OAuth redirect (?auth=success)
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  // 1. Fetch public campus locations on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchLocations() {
      try {
        const backendLocations = await locationService.getLocations();
        if (!cancelled) {
          const mapped = backendLocations.map(mapBackendToFrontend);
          setApiLocations(mapped);

          // Deep linking: check URL search parameters (?to=...&from=...)
          let targetDest: CampusLocation | null = null;
          let targetOrigin: CampusLocation | null = null;

          if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const { to, from } = parseNavigateParams(searchParams);
            if (to) {
              const matchedDest = validateLocationIdentifier(to, mapped);
              if (matchedDest) targetDest = matchedDest as CampusLocation;
            }
            if (from) {
              if (from.toLowerCase() === "gps") {
                setIsOriginCurrentLocation(true);
              } else {
                const matchedOrig = validateLocationIdentifier(from, mapped);
                if (matchedOrig) targetOrigin = matchedOrig as CampusLocation;
              }
            }
          }

          // Default fallback route: Gate 1 -> Block 1
          const mainGate = mapped.find((l) => l.slug === "gate-1") || mapped[0] || null;
          const block1 =
            mapped.find((l) => l.slug === "block-1") ||
            mapped.find((l) => l.id !== mainGate?.id) ||
            null;

          setOriginLocation(targetOrigin || mainGate);
          setSelectedLocation(targetDest || block1);
        }
      } catch (err) {
        console.warn("[ExplorePage] Failed to fetch verified campus locations:", err);
      } finally {
        if (!cancelled) setLocationsLoaded(true);
      }
    }
    fetchLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Check URL search parameters on mount
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

  // 3. Compute optimal walking path whenever origin or destination changes
  useEffect(() => {
    let isCancelled = false;

    if (locationsLoaded && apiLocations.length === 0) {
      queueMicrotask(() => {
        if (!isCancelled) {
          setActiveRoute(null);
          setRouteError("Verified campus locations are currently unavailable.");
        }
      });
    } else if (
      locationsLoaded &&
      originLocation &&
      selectedLocation &&
      originLocation.id !== selectedLocation.id
    ) {
      queueMicrotask(() => {
        if (!isCancelled) {
          setActiveRoute(null);
          setRouteError(null);
        }
      });
      routeService
        .calculateRoute(originLocation, selectedLocation)
        .then((rt) => {
          if (!isCancelled) {
            setActiveRoute(rt);
            setRouteError(null);
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            return;
          }
          console.warn("[ExplorePage] Route calculation error:", err);
          if (!isCancelled) {
            setActiveRoute(null);
            setRouteError(
              err instanceof Error ? err.message : "Unable to calculate route."
            );
          }
        });
    } else if (
      originLocation &&
      selectedLocation &&
      originLocation.id === selectedLocation.id
    ) {
      queueMicrotask(() => {
        if (!isCancelled) {
          setActiveRoute(null);
          setRouteError(null);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [originLocation, selectedLocation, locationsLoaded, apiLocations.length]);

  // Location Handlers
  const handleSelectOrigin = (loc: CampusLocation) => {
    setOriginLocation(loc);
  };

  const handleSelectDestination = (loc: CampusLocation) => {
    setSelectedLocation(loc);
  };

  const handleSwapLocations = () => {
    if (originLocation && selectedLocation) {
      const temp = originLocation;
      setOriginLocation(selectedLocation);
      setSelectedLocation(temp);
    }
  };

  const handleUseCurrentLocation = () => {
    const mainGate = allLocations.find((l) => l.slug === "gate-1") || allLocations[0];
    if (mainGate) {
      setOriginLocation(mainGate);
    }
  };

  const handleSelectCurrentLocationAsOrigin = async () => {
    setIsOriginCurrentLocation(true);
    if (!geo.coordinates) {
      await geo.requestLocation();
    }
  };

  // Snap GPS position to nearest graph node when "My current location" is active
  useEffect(() => {
    if (!isOriginCurrentLocation || !geo.coordinates) return;

    if (!geo.isInsideCampus) {
      return;
    }

    if (backendNodes.length === 0) return;

    const snapResult = snapGpsToGraphNode(geo.coordinates, backendNodes);
    if (snapResult.snappedNode) {
      const snapped = snapResult.snappedNode;
      const nearbyLoc = allLocations.find(
        (l) => l.nodeId === snapped.id || l.id === snapped.location_id
      );

      const gpsOriginLocation: CampusLocation = {
        id: "current-location",
        name: "My Current Location",
        code: "GPS",
        category: "landmark",
        description: `GPS position near ${nearbyLoc?.name || snapped.survey_id || "campus walkway"}`,
        coordinates: {
          lat: geo.coordinates.latitude,
          lng: geo.coordinates.longitude,
        },
        nodeId: snapped.id,
      };

      setOriginLocation(gpsOriginLocation);

      // Check if re-routing is required
      if (
        lastRoutedCoordsRef.current &&
        activeRoute &&
        shouldRecomputeRoute(lastRoutedCoordsRef.current, geo.coordinates, activeRoute.waypoints)
      ) {
        setIsRerouting(true);
        lastRoutedCoordsRef.current = {
          latitude: geo.coordinates.latitude,
          longitude: geo.coordinates.longitude,
        };
        if (selectedLocation) {
          routeService
            .calculateRoute(gpsOriginLocation, selectedLocation)
            .then((rt) => {
              setActiveRoute(rt);
              setIsRerouting(false);
            })
            .catch(() => {
              setIsRerouting(false);
            });
        }
      } else if (!lastRoutedCoordsRef.current) {
        lastRoutedCoordsRef.current = {
          latitude: geo.coordinates.latitude,
          longitude: geo.coordinates.longitude,
        };
      }
    }
  }, [
    isOriginCurrentLocation,
    geo.coordinates,
    geo.isInsideCampus,
    backendNodes,
    allLocations,
    selectedLocation,
    activeRoute,
  ]);

  const handleToggleSaveLocation = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectPredefinedRoute = (fromId: string, toId: string) => {
    const from = allLocations.find((l) => l.id === fromId || l.slug === fromId);
    const to = allLocations.find((l) => l.id === toId || l.slug === toId);
    if (from) setOriginLocation(from);
    if (to) setSelectedLocation(to);
    startTransition(() => {
      setCurrentTab("explore");
    });
  };

  // Filtered locations based on debounced topbar search query
  const displayedLocations = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return allLocations;
    return allLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q) ||
        loc.departments?.some((d) => d.toLowerCase().includes(q))
    );
  }, [debouncedSearchQuery, allLocations]);

  const savedLocationsList = useMemo(() => {
    return allLocations.filter((l) => savedIds.includes(l.id));
  }, [savedIds, allLocations]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0f1d] text-zinc-100 font-sans">
      {/* 1. Left Navigation Sidebar */}
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

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          locationsStatus={
            !locationsLoaded ? "loading" : apiLocations.length > 0 ? "available" : "unavailable"
          }
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onToggleMobileDrawer={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          isMobileDrawerOpen={mobileDrawerOpen}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
        />

        {/* OAuth Authentication Success Banner */}
        {authSuccessToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-2 text-xs flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {authSuccessToast} Signed in as <b>{user?.name || user?.email || "your account"}</b>.
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
              {/* Central Map Canvas (Mapbox with Vector Fallback) */}
              <main
                className="flex-1 h-full min-w-0 relative"
                aria-label="Campus Interactive Map"
              >
                <CampusMap
                  locations={displayedLocations}
                  originLocation={originLocation}
                  selectedLocation={selectedLocation}
                  onSelectLocation={handleSelectDestination}
                  onSetOrigin={handleSelectOrigin}
                  onSetDestination={handleSelectDestination}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                  userCoordinates={geo.coordinates}
                  geolocationStatus={geo.status}
                  geolocationPermission={geo.permissionState}
                  onLocateUser={geo.requestLocation}
                  isInsideCampus={geo.isInsideCampus}
                  geolocationError={geo.error?.message}
                />
                <MockLocationPanel
                  isMocked={geo.isMocked}
                  currentCoords={geo.coordinates}
                  onSetMockCoordinates={geo.setMockCoordinates}
                />
              </main>

              {/* Right Destination Panel (Point A to Point B Routing) */}
              <div
                className={`lg:block ${mobileDrawerOpen
                  ? "fixed inset-y-16 right-0 w-full sm:w-96 z-40 shadow-2xl block"
                  : "hidden lg:block"
                  }`}
              >
                <DestinationPanel
                  locations={displayedLocations}
                  originLocation={originLocation}
                  selectedLocation={selectedLocation}
                  onSelectOrigin={(loc) => {
                    setIsOriginCurrentLocation(false);
                    handleSelectOrigin(loc);
                  }}
                  onSelectDestination={handleSelectDestination}
                  onSelectLocation={handleSelectDestination}
                  onSwapLocations={() => {
                    setIsOriginCurrentLocation(false);
                    handleSwapLocations();
                  }}
                  onUseCurrentLocation={() => {
                    setIsOriginCurrentLocation(false);
                    handleUseCurrentLocation();
                  }}
                  onSelectCurrentLocationAsOrigin={handleSelectCurrentLocationAsOrigin}
                  isOriginCurrentLocation={isOriginCurrentLocation}
                  isRerouting={isRerouting}
                  userCoordinates={geo.coordinates}
                  isInsideCampus={geo.isInsideCampus}
                  geolocationError={geo.error?.message}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                  onToggleRoute={() => setShowRoute(!showRoute)}
                  routeError={routeError}
                  savedLocationIds={savedIds}
                  onToggleSaveLocation={handleToggleSaveLocation}
                  onOpenQrScanner={() => setIsQrScannerOpen(true)}
                />
              </div>
            </>
          )}

          {currentTab === "routes" && (
            <main className="flex-1 h-full overflow-y-auto">
              <RoutesTab
                locations={allLocations}
                onSelectRoute={handleSelectPredefinedRoute}
              />
            </main>
          )}

          {currentTab === "saved" && (
            <main className="flex-1 h-full overflow-y-auto">
              <SavedTab
                savedLocations={savedLocationsList}
                onSelectLocation={handleSelectDestination}
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

      {/* 4. QR Scanner Modal */}
      {FEATURE_QR && (
        <QrScannerModal
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          onScanSuccess={(scannedDest, scannedOrigin) => {
            const destLoc =
              allLocations.find((l) => l.slug === scannedDest.slug || l.id === scannedDest.id) ||
              (scannedDest as CampusLocation);

            handleSelectDestination(destLoc);

            if (scannedOrigin) {
              if (scannedOrigin.toLowerCase() === "gps") {
                setIsOriginCurrentLocation(true);
                geo.requestLocation();
              } else {
                const matchedOrig = allLocations.find(
                  (l) => l.slug === scannedOrigin || l.id === scannedOrigin
                );
                if (matchedOrig) {
                  setIsOriginCurrentLocation(false);
                  handleSelectOrigin(matchedOrig);
                }
              }
            }
            setIsQrScannerOpen(false);
          }}
        />
      )}
    </div>
  );
}
