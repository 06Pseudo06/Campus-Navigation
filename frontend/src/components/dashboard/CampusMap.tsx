"use client";

import React from "react";
import { CampusLocation, CampusRoute, MapDisplayMode } from "@/types/campus";
import { CarletonDemoMap } from "./CarletonDemoMap";

interface CampusMapProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  originLocation?: CampusLocation | null;
  onSelectLocation: (location: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
  mapDisplayMode?: MapDisplayMode;
  onToggleMapMode?: (mode: MapDisplayMode) => void;
}

export function CampusMap({
  locations,
  selectedLocation,
  originLocation = null,
  onSelectLocation,
  activeRoute,
  showRoute,
}: CampusMapProps) {
  return (
    <div className="relative w-full h-full bg-[#070b14] overflow-hidden select-none">
      <CarletonDemoMap
        locations={locations}
        selectedLocation={selectedLocation}
        originLocation={originLocation}
        onSelectLocation={onSelectLocation}
        activeRoute={activeRoute}
        showRoute={showRoute}
      />
    </div>
  );
}
