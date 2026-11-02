"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CampusMap } from "@/components/dashboard/CampusMap";
import { DestinationPanel } from "@/components/dashboard/DestinationPanel";
import { RoutesTab } from "@/components/dashboard/RoutesTab";
import { SavedTab } from "@/components/dashboard/SavedTab";
import { HelpTab } from "@/components/dashboard/HelpTab";
import {
  SAMPLE_LOCATIONS,
} from "@/data/campusData";
import { routeService } from "@/services/routeService";
import {
  CampusLocation,
  CampusRoute,
  SidebarTab,
} from "@/types/campus";
import { Spinner, CampusWayLogo } from "@/components/icons/Icons";

export default function ExploreDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [, startTransition] = useTransition();

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<SidebarTab>("explore");

  // Mobile menu / drawer controls
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Global search & filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Location selection: default to Block 34 as requested
  const defaultLocation =
    SAMPLE_LOCATIONS.find((l) => l.id === "loc-block-34") || SAMPLE_LOCATIONS[0];
  const [selectedLocation, setSelectedLocation] =
    useState<CampusLocation | null>(defaultLocation);

  // Route preview state
  const [activeRoute, setActiveRoute] = useState<CampusRoute | null>(null);
  const [showRoute, setShowRoute] = useState<boolean>(true); // Initial demo displays route to Block 34

  // Saved location IDs
  const [savedIds, setSavedIds] = useState<string[]>(["loc-block-34", "loc-library"]);

  // Success toast for OAuth redirect (?auth=success)
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  // 1. Authentication Gate
  useEffect(() => {
    if (!authLoading && !user) {
      // User is not authenticated; redirect to login
      router.push("/login?error=session_required");
    }
  }, [user, authLoading, router]);

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
          // Clean URL query without reload
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 4500);
      });
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, []);

  // 2. Fetch/update route whenever destination changes
  useEffect(() => {
    let isCancelled = false;
    if (selectedLocation) {
      routeService
        .calculateRoute("loc-main-gate", selectedLocation.id)
        .then((rt) => {
          if (!isCancelled) {
            setActiveRoute(rt);
          }
        });
    } else {
      queueMicrotask(() => {
        if (!isCancelled) {
          setActiveRoute(null);
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedLocation]);

  // Handler: Selecting a location from map or destination panel
  const handleSelectLocation = (loc: CampusLocation) => {
    setSelectedLocation(loc);
    // When a location is selected from Routes/Saved tab, automatically switch to explore tab
    if (currentTab !== "explore") {
      setCurrentTab("explore");
    }
    // Automatically close mobile destination drawer when a location is chosen so user sees map
    setMobileDrawerOpen(false);
  };

  // Handler: Selecting a predefined route from Routes tab
  const handleSelectPredefinedRoute = (fromId: string, toId: string) => {
    const targetLoc = SAMPLE_LOCATIONS.find((l) => l.id === toId);
    if (targetLoc) {
      setSelectedLocation(targetLoc);
      setShowRoute(true);
      setCurrentTab("explore");
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
    if (!searchQuery.trim()) return SAMPLE_LOCATIONS;
    const q = searchQuery.toLowerCase().trim();
    return SAMPLE_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q) ||
        loc.departments?.some((d) => d.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const savedLocationsList = useMemo(() => {
    return SAMPLE_LOCATIONS.filter((l) => savedIds.includes(l.id));
  }, [savedIds]);

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

  // If not authenticated, the useEffect is redirecting to /login
  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0a0f1d] text-slate-500 dark:text-zinc-400 text-xs">
        Redirecting to sign-in...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F7FB] dark:bg-[#0a0f1d] text-[#172033] dark:text-zinc-100 font-sans transition-colors">
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
        />

        {/* Auth success toast */}
        {authSuccessToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-2 text-xs flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {authSuccessToast} Signed in as <b>{user.name || user.email}</b>.
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
                  selectedLocation={selectedLocation}
                  onSelectLocation={handleSelectLocation}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
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
                  onSelectLocation={handleSelectLocation}
                  activeRoute={activeRoute}
                  showRoute={showRoute}
                  onToggleRoute={() => setShowRoute(!showRoute)}
                  savedLocationIds={savedIds}
                  onToggleSaveLocation={handleToggleSaveLocation}
                />
              </div>
            </>
          )}

          {currentTab === "routes" && (
            <main className="flex-1 h-full overflow-y-auto">
              <RoutesTab
                locations={SAMPLE_LOCATIONS}
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
