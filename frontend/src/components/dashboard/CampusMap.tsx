"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
  Popup,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { CampusLocation, CampusRoute, MapLayerMode } from "@/types/campus";
import {
  LayersIcon,
  WalkingIcon,
  AccessibilityIcon,
} from "./DashboardIcons";

// ──────────────────────────────────────────────────────────────────
// Dataset C's surveyed LPU Main Gate coordinate, used only as the initial camera view.
// ──────────────────────────────────────────────────────────────────
const DATASET_C_INITIAL_CENTER = { latitude: 31.260565, longitude: 75.706815 };
const DEFAULT_ZOOM = 16;

// Mapbox styles
const MAP_STYLES: Record<MapLayerMode, string> = {
  dark: "mapbox://styles/mapbox/dark-v11",
  standard: "mapbox://styles/mapbox/navigation-night-v1",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets: "mapbox://styles/mapbox/streets-v12",
};

// Category colors for map pins
const CATEGORY_COLORS: Record<string, string> = {
  gate: "#10b981",
  building: "#DE4B31",
  service: "#EC4899",
  landmark: "#F59E0B",
  room: "#8B5CF6",
  hostel: "#3B82F6",
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface CampusMapProps {
  locations: CampusLocation[];
  originLocation?: CampusLocation | null;
  selectedLocation: CampusLocation | null;
  onSelectLocation: (location: CampusLocation) => void;
  onSetOrigin?: (location: CampusLocation) => void;
  onSetDestination?: (location: CampusLocation) => void;
  activeRoute: CampusRoute | null;
  showRoute: boolean;
}

export function CampusMap({
  locations,
  originLocation,
  selectedLocation,
  onSelectLocation,
  onSetOrigin,
  onSetDestination,
  activeRoute,
  showRoute,
}: CampusMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [layer, setLayer] = useState<MapLayerMode>("dark");
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [popupLocation, setPopupLocation] = useState<CampusLocation | null>(null);

  // Fly to selected destination location when it changes
  useEffect(() => {
    if (selectedLocation && Number.isFinite(selectedLocation.coordinates.lat) && Number.isFinite(selectedLocation.coordinates.lng) && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedLocation.coordinates.lng, selectedLocation.coordinates.lat],
        zoom: 17,
        pitch: 50,
        duration: 1200,
      });
    }
  }, [selectedLocation]);

  // Build GeoJSON LineString for the active route polyline
  const routeGeoJSON = useMemo(() => {
    if (!showRoute || !activeRoute?.waypoints?.length) return null;
    const coords = activeRoute.waypoints
      .filter((wp) => Number.isFinite(wp.lng) && Number.isFinite(wp.lat))
      .map((wp) => [wp.lng!, wp.lat!]);
    if (coords.length < 2) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: coords,
      },
    };
  }, [showRoute, activeRoute]);

  const handleMarkerClick = useCallback(
    (loc: CampusLocation) => {
      onSelectLocation(loc);
      setPopupLocation(loc);
    },
    [onSelectLocation]
  );

  // If no Mapbox token, show a helpful placeholder
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "YOUR_MAPBOX_TOKEN_HERE") {
    return (
      <div className="relative w-full h-full bg-[#0a0f1d] flex flex-col items-center justify-center text-zinc-400 px-8">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#DE4B31]/20 border border-[#DE4B31]/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#DE4B31]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Mapbox Token Required</h3>
          <p className="text-sm leading-relaxed">
            To display the interactive campus map, add your Mapbox access token to{" "}
            <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-[#DE4B31]">frontend/.env.local</code>
          </p>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-left font-mono text-xs">
            <span className="text-zinc-500">NEXT_PUBLIC_MAPBOX_TOKEN=</span>
            <span className="text-emerald-400">pk.eyJ1Ijoi...</span>
          </div>
          <p className="text-xs text-zinc-500">
            Get a free token at{" "}
            <a href="https://mapbox.com" className="text-[#DE4B31] underline" target="_blank" rel="noopener">
              mapbox.com
            </a>{" "}
            (50,000 free map loads/month)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0a0f1d] overflow-hidden select-none flex flex-col">
      {/* ──── Map Layer Switcher (Top-Right) ──── */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            className={`w-10 h-10 rounded-xl border shadow-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
              layerMenuOpen || layer !== "dark"
                ? "bg-[#DE4B31] text-white border-[#DE4B31]"
                : "bg-[#111827]/90 hover:bg-[#1f2937] text-zinc-200 border-zinc-700/80"
            }`}
            title="Map Layer"
            aria-label="Map Layer"
          >
            <LayersIcon className="w-5 h-5" />
          </button>
          {layerMenuOpen && (
            <div className="absolute right-12 top-0 w-48 rounded-xl bg-[#111827] border border-zinc-700 shadow-2xl p-1.5 z-30">
              <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Map Style
              </span>
              {(
                [
                  { id: "dark", label: "🌙 Dark Navigation" },
                  { id: "standard", label: "🗺️ Navigation Night" },
                  { id: "satellite", label: "🛰️ Satellite" },
                  { id: "streets", label: "🏙️ Streets" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setLayer(mode.id);
                    setLayerMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    layer === mode.id
                      ? "bg-[#DE4B31] text-white"
                      : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span>{mode.label}</span>
                  {layer === mode.id && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ──── Floating Route Info Banner ──── */}
      {showRoute && activeRoute && (
        <div className="absolute top-4 left-4 z-20 max-w-sm rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-[#DE4B31]/60 shadow-2xl p-3.5 text-zinc-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#DE4B31]/20 border border-[#DE4B31]/40 flex items-center justify-center text-[#DE4B31] shrink-0">
                <WalkingIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  To: {activeRoute.toName}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  From: {activeRoute.fromName}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold text-[#DE4B31]">
                ~{activeRoute.estimatedWalkingMinutes} min
              </span>
              <p className="text-[10px] text-zinc-400">
                ~{activeRoute.distanceMeters} m est.
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <AccessibilityIcon className="w-3 h-3" /> Accessibility unverified
            </span>
            <span className="font-mono text-zinc-500">
              {activeRoute.isDemonstrationData ? "Demo route" : "Campus graph route"}
            </span>
          </div>
        </div>
      )}

      {/* ──── Mapbox GL Map ──── */}
      <div className="flex-1 w-full h-full">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            ...DATASET_C_INITIAL_CENTER,
            zoom: DEFAULT_ZOOM,
            pitch: 45,
            bearing: -17,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLES[layer]}
          attributionControl={false}
          reuseMaps
          onError={(e) => {
            // Gracefully handle tile loading errors (e.g. 429 rate limit or 404 missing high-zoom tiles)
            // so Next.js Turbopack does not trigger a blocking error overlay in development mode
            const msg = e.error instanceof Error ? e.error.message : String(e.error ?? "");
            if (
              msg.includes("429") ||
              msg.includes("Too Many Requests") ||
              msg.includes("tile") ||
              msg.includes("404")
            ) {
              return;
            }
            console.warn("[Mapbox]", msg || e);
          }}
        >
          {/* Built-in navigation controls */}
          <NavigationControl position="bottom-right" showCompass visualizePitch />
          <GeolocateControl position="bottom-right" />

          {/* ──── 3D Building Extrusion Layer ──── */}
          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            type="fill-extrusion"
            minzoom={14}
            paint={{
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["get", "height"],
                0, "#1e293b",
                50, "#334155",
                100, "#475569",
              ],
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": ["get", "min_height"],
              "fill-extrusion-opacity": 0.7,
            }}
          />

          {/* ──── Route Polyline ──── */}
          {routeGeoJSON && (
            <>
              {/* Route casing (dark outline) */}
              <Source id="route-casing" type="geojson" data={routeGeoJSON}>
                <Layer
                  id="route-casing-layer"
                  type="line"
                  paint={{
                    "line-color": "#000000",
                    "line-width": 8,
                    "line-opacity": 0.5,
                  }}
                  layout={{
                    "line-join": "round",
                    "line-cap": "round",
                  }}
                />
              </Source>
              {/* Route main line */}
              <Source id="route-line" type="geojson" data={routeGeoJSON}>
                <Layer
                  id="route-line-layer"
                  type="line"
                  paint={{
                    "line-color": "#DE4B31",
                    "line-width": 5,
                    "line-opacity": 0.9,
                  }}
                  layout={{
                    "line-join": "round",
                    "line-cap": "round",
                  }}
                />
              </Source>
              {/* Route dashed overlay */}
              <Source id="route-dash" type="geojson" data={routeGeoJSON}>
                <Layer
                  id="route-dash-layer"
                  type="line"
                  paint={{
                    "line-color": "#ffffff",
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                    "line-opacity": 0.6,
                  }}
                  layout={{
                    "line-join": "round",
                    "line-cap": "round",
                  }}
                />
              </Source>
            </>
          )}

          {/* ──── Location Markers ──── */}
          {locations
            .filter((loc) => Number.isFinite(loc.coordinates.lat) && Number.isFinite(loc.coordinates.lng))
            .map((loc) => {
              const isDestination = selectedLocation?.id === loc.id;
              const isOrigin = originLocation?.id === loc.id;
              const isHighlighted = isDestination || isOrigin;
              const color = isOrigin
                ? "#10b981"
                : isDestination
                ? "#DE4B31"
                : CATEGORY_COLORS[loc.category] || "#6366F1";

              return (
                <Marker
                  key={loc.id}
                  latitude={loc.coordinates.lat}
                  longitude={loc.coordinates.lng}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(loc);
                  }}
                >
                  {/* Custom Pin SVG */}
                  <div
                    className={`relative cursor-pointer transition-transform duration-200 ${
                      isHighlighted ? "scale-125 z-10" : "hover:scale-110"
                    }`}
                    title={loc.name}
                  >
                    <svg
                      width={isHighlighted ? "36" : "28"}
                      height={isHighlighted ? "44" : "36"}
                      viewBox="0 0 28 36"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Pin body */}
                      <path
                        d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z"
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {/* Inner circle */}
                      <circle cx="14" cy="13" r="6" fill="#ffffff" fillOpacity="0.9" />
                      {/* Category icon dot */}
                      <circle cx="14" cy="13" r="3" fill={color} />
                    </svg>

                    {/* Pin label */}
                    <div
                      className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg ${
                        isOrigin
                          ? "bg-emerald-600 text-white"
                          : isDestination
                          ? "bg-[#DE4B31] text-white"
                          : "bg-[#111827]/95 text-zinc-200 border border-zinc-700"
                      }`}
                    >
                      {isOrigin
                        ? `START • ${loc.code || loc.name}`
                        : isDestination
                        ? `DEST • ${loc.code || loc.name}`
                        : loc.code || loc.name}
                    </div>
                  </div>
                </Marker>
              );
            })}

          {/* ──── Popup on clicked location ──── */}
          {popupLocation && Number.isFinite(popupLocation.coordinates.lat) && Number.isFinite(popupLocation.coordinates.lng) && (
            <Popup
              latitude={popupLocation.coordinates.lat}
              longitude={popupLocation.coordinates.lng}
              anchor="top"
              onClose={() => setPopupLocation(null)}
              closeOnClick={false}
              className="campus-popup"
              maxWidth="280px"
            >
              <div className="p-1.5 space-y-2">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{popupLocation.name}</h3>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {popupLocation.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[popupLocation.category] || "#6366F1" }}
                  >
                    {popupLocation.category.toUpperCase()}
                  </span>
                  {popupLocation.floors && (
                    <span className="text-[10px] text-gray-500">{popupLocation.floors}</span>
                  )}
                </div>

                {/* Direct Action Buttons: Start here OR Go here */}
                <div className="pt-2 border-t border-gray-200 flex items-center gap-1.5">
                  {onSetOrigin && (
                    <button
                      type="button"
                      onClick={() => {
                        onSetOrigin(popupLocation);
                        setPopupLocation(null);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>📍 Start Here</span>
                    </button>
                  )}
                  {onSetDestination && (
                    <button
                      type="button"
                      onClick={() => {
                        onSetDestination(popupLocation);
                        setPopupLocation(null);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-[#DE4B31] hover:bg-[#b83821] text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🏁 Go Here</span>
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ──── Map Footer Bar ──── */}
      <div className="h-10 px-4 bg-[#0a0f1d]/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DE4B31]" />
            <span>Academic</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
            <span>Hostels</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
            <span>Gates</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EC4899]" />
            <span>Food & Services</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-500">
            LPU Campus — Phagwara, Punjab
          </span>
        </div>
      </div>
    </div>
  );
}
