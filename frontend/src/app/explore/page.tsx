"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CampusMap } from "@/components/dashboard/CampusMap";
import { DestinationPanel } from "@/components/dashboard/DestinationPanel";
import { RoutesTab } from "@/components/dashboard/RoutesTab";
import { SavedTab } from "@/components/dashboard/SavedTab";
import { HelpTab } from "@/components/dashboard/HelpTab";
import {
  mapBackendToFrontend,
} from "@/data/campusData";
import { locationService } from "@/services/locationService";
import { routeService } from "@/services/routeService";
import {
  CampusLocation,
  CampusRoute,
  SidebarTab,
} from "@/types/campus";

export default function ExploreDashboardPage() {
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<SidebarTab>("explore");

  // Mobile menu / drawer controls
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Global search & filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Dataset C locations loaded from the backend.
  const [apiLocations, setApiLocations] = useState<CampusLocation[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const allLocations = apiLocations;

  // Starting point and destination are chosen from Dataset C after it loads.
  const [originLocation, setOriginLocation] = useState<CampusLocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);

  // Route preview state
  const [activeRoute, setActiveRoute] = useState<CampusRoute | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState<boolean>(true);

  // Saved location IDs
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Success toast for OAuth redirect (?auth=success)
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  // Fetch public campus locations on mount.
  useEffect(() => {
    let cancelled = false;
    async function fetchLocations() {
      try {
        const backendLocations = await locationService.getLocations();
        if (!cancelled) {
          const mapped = backendLocations.map(mapBackendToFrontend);
          setApiLocations(mapped);

          const mainGate = mapped.find((l) => l.slug === "gate-1");
          const block1 = mapped.find((l) => l.slug === "block-1");
          setOriginLocation(mainGate ?? null);
          setSelectedLocation(block1 ?? mapped.find((l) => l.id !== mainGate?.id) ?? null);
        }
      } catch (err) {
        console.warn("[ExplorePage] Verified campus locations are unavailable:", err);
      } finally {
        if (!cancelled) setLocationsLoaded(true);
      }
    }
    fetchLocations();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Calculate only after the public location catalog has loaded.
  useEffect(() => {
    let isCancelled = false;

    if (locationsLoaded && apiLocations.length === 0) {
      queueMicrotask(() => {
        if (!isCancelled) {
          setActiveRoute(null);
          setRouteError("Verified campus locations are currently unavailable.");
        }
      });
    } else if (locationsLoaded && originLocation && selectedLocation && originLocation.id !== selectedLocation.id) {
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
          }
        })
        .catch((err) => {
          console.warn("[ExplorePage] Route calculation error:", err);
          if (!isCancelled) {
            setActiveRoute(null);
            setRouteError(err instanceof Error ? err.message : "Unable to calculate this route.");
          }
        });
    } else {
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
  }, [apiLocations.length, locationsLoaded, originLocation, selectedLocation]);

  // Handler: Selecting origin location
  const handleSelectOrigin = (loc: CampusLocation) => {
    setOriginLocation(loc);
    setShowRoute(true);
    if (currentTab !== "explore") setCurrentTab("explore");
  };

  // Handler: Selecting destination location
  const handleSelectDestination = (loc: CampusLocation) => {
    setSelectedLocation(loc);
    setShowRoute(true);
    if (currentTab !== "explore") setCurrentTab("explore");
    setMobileDrawerOpen(false);
  };

  // Handler: Swapping origin and destination
  const handleSwapLocations = () => {
    const temp = originLocation;
    setOriginLocation(selectedLocation);
    setSelectedLocation(temp);
  };

  // Handler: Use Current GPS location as starting point
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLoc: CampusLocation = {
          id: "current-gps-location",
          name: "My Current Location",
          code: "GPS",
          category: "landmark",
          description: `Live GPS: ${pos.coords.latitude.toFixed(5)}° N, ${pos.coords.longitude.toFixed(5)}° E`,
          coordinates: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          accessibility: "Current Location",
          popular: false,
        };
        setOriginLocation(currentLoc);
        setShowRoute(true);
      },
      (err) => {
        console.warn("[Geolocation] Error acquiring position:", err);
        alert(
          "Could not detect your current location. Please verify that browser location permissions are granted."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handler: Selecting a route built from the loaded Dataset C locations.
  const handleSelectPredefinedRoute = (fromId: string, toId: string) => {
    const origLoc = allLocations.find((l) => l.id === fromId);
    const destLoc = allLocations.find((l) => l.id === toId);

    if (origLoc) setOriginLocation(origLoc);
    if (destLoc) setSelectedLocation(destLoc);

    setShowRoute(true);
    setCurrentTab("explore");
  };

  // Handler: Toggle bookmark for a location
  const handleToggleSaveLocation = (locId: string) => {
    setSavedIds((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  // 4. Search: API-powered when connected, client-side fallback
  const displayedLocations = useMemo(() => {
    if (!searchQuery.trim()) return allLocations;
    const q = searchQuery.toLowerCase().trim();
    return allLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q) ||
        loc.departments?.some((d) => d.toLowerCase().includes(q))
    );
  }, [searchQuery, allLocations]);

  const savedLocationsList = useMemo(() => {
    return allLocations.filter((l) => savedIds.includes(l.id));
  }, [savedIds, allLocations]);

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
          locationsStatus={
            !locationsLoaded ? "loading" : apiLocations.length > 0 ? "available" : "unavailable"
          }
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onToggleMobileDrawer={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          isMobileDrawerOpen={mobileDrawerOpen}
        />

        {/* Auth success toast */}
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
              className="text-emerald-400 hover:text-white text-xs font-bold px-2"
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
                  originLocation={originLocation}
                  selectedLocation={selectedLocation}
                  onSelectLocation={handleSelectDestination}
                  onSetOrigin={handleSelectOrigin}
                  onSetDestination={handleSelectDestination}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                />
              </main>

              {/* Right Destination Panel (Point A to Point B Routing) */}
              <div
                className={`lg:block ${
                  mobileDrawerOpen
                    ? "fixed inset-y-16 right-0 w-full sm:w-96 z-40 shadow-2xl block"
                    : "hidden lg:block"
                }`}
              >
                <DestinationPanel
                  locations={displayedLocations}
                  originLocation={originLocation}
                  selectedLocation={selectedLocation}
                  onSelectOrigin={handleSelectOrigin}
                  onSelectDestination={handleSelectDestination}
                  onSwapLocations={handleSwapLocations}
                  onUseCurrentLocation={handleUseCurrentLocation}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                  onToggleRoute={() => setShowRoute(!showRoute)}
                  routeError={routeError}
                  savedLocationIds={savedIds}
                  onToggleSaveLocation={handleToggleSaveLocation}
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
    </div>
  );
}
