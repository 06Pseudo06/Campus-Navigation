import { CampusLocation, CampusRoute } from "@/types/campus";
import { BackendLocation, BackendNode } from "@/services/locationService";

/**
 * Coordinate Bounding Box for LPU Dataset C
 * Lat: ~31.2561 to 31.2606
 * Lng: ~75.7058 to 75.7087
 */
export const CAMPUS_BOUNDS = {
  latMin: 31.2558,
  latMax: 31.2610,
  lngMin: 75.7054,
  lngMax: 75.7090,
};

/**
 * Project WGS84 GPS Coordinates to SVG ViewBox (1000 x 700).
 * Handles geographic inversion (higher latitude = lower SVG Y).
 */
export function projectGpsToSvg(lat: number, lng: number): { x: number; y: number } {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { x: 500, y: 350 };
  }
  const normX = (lng - CAMPUS_BOUNDS.lngMin) / (CAMPUS_BOUNDS.lngMax - CAMPUS_BOUNDS.lngMin);
  const normY = (CAMPUS_BOUNDS.latMax - lat) / (CAMPUS_BOUNDS.latMax - CAMPUS_BOUNDS.latMin);

  // Clamp within SVG canvas margins (5% to 95%)
  const clampedX = Math.max(0.05, Math.min(0.95, normX));
  const clampedY = Math.max(0.05, Math.min(0.95, normY));

  return {
    x: Math.round(clampedX * 1000 * 10) / 10,
    y: Math.round(clampedY * 700 * 10) / 10,
  };
}

/**
 * Map a backend Location entity to the frontend CampusLocation model.
 */
export function mapBackendToFrontend(loc: BackendLocation): CampusLocation {
  const lat = loc.latitude ?? Number.NaN;
  const lng = loc.longitude ?? Number.NaN;
  const svgPos = Number.isFinite(lat) && Number.isFinite(lng) ? projectGpsToSvg(lat, lng) : undefined;

  return {
    id: loc.id,
    name: loc.name,
    code: loc.slug
      ? loc.slug.replace(/-/g, " ").toUpperCase().substring(0, 10)
      : loc.name.substring(0, 8).toUpperCase(),
    category: (loc.location_type as CampusLocation["category"]) || "building",
    parentBuildingId: loc.parent_id || undefined,
    description: loc.description || "Verified destination in LPU Dataset C.",
    coordinates: {
      lat,
      lng,
      x: svgPos?.x,
      y: svgPos?.y,
    },
    floors: loc.address_details || undefined,
    accessibility: loc.is_verified ? "Verified Pedestrian Access" : "Pending Verification",
    popular: loc.is_verified || false,
    slug: loc.slug,
  };
}

// ──────────────────────────────────────────────────────────────────
// Verified LPU Dataset C Catalog (15 Destinations, 27 Nodes, 29 Segments)
// Used when backend API is starting up, offline, or in standalone mode.
// ──────────────────────────────────────────────────────────────────

export const VERIFIED_DATASET_C_LOCATIONS: BackendLocation[] = [
  {
    id: "f3747ebc-e653-5694-8aa7-71b9be8b082e",
    parent_id: null,
    name: "Gate 1 (Main Gate)",
    slug: "gate-1",
    location_type: "gate",
    description: "Primary north entrance to LPU campus with transit access.",
    latitude: 31.260565,
    longitude: 75.706815,
    address_details: "Main North Boulevard",
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "0ecff5ec-1e56-57c1-b28f-66a9d1579d0d",
    parent_id: null,
    name: "Hosteller Exit/Entry Gate",
    slug: "hosteller-exit-entry-gate",
    location_type: "gate",
    description: "Dedicated residential hostel boundary checkpoint.",
    latitude: 31.260193,
    longitude: 75.707385,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "6e078c8a-78f9-58b4-934c-6fa103ef8081",
    parent_id: null,
    name: "LPU Main Gate Parking",
    slug: "visitor-parking",
    location_type: "service",
    description: "Designated visitor and faculty surface parking facility.",
    latitude: 31.259424,
    longitude: 75.705887,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "c2986647-380f-569c-be37-8f4694f176c8",
    parent_id: null,
    name: "Baldev Raj Mittal Park",
    slug: "baldev-raj-mittal-park",
    location_type: "landmark",
    description: "Central landscaped public gathering garden.",
    latitude: 31.258994,
    longitude: 75.706935,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "614fc2a0-ea37-5ea0-a92c-623bb66c1b3f",
    parent_id: null,
    name: "University Hospital",
    slug: "uni-hospital",
    location_type: "building",
    description: "Full-service on-campus healthcare clinic and emergency ward.",
    latitude: 31.258222,
    longitude: 75.706861,
    address_details: "Near Junction 3",
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "eb28842b-ae3a-5900-9e8c-8f23788fffa9",
    parent_id: null,
    name: "Shri Baldev Raj Mittal Auditorium",
    slug: "baldev-auditorium",
    location_type: "building",
    description: "Major university cultural center, convocation and events hall.",
    latitude: 31.25831,
    longitude: 75.707822,
    address_details: "East Central Walk",
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "66fcfa57-ea5c-5154-8e7c-87d1ea21a41b",
    parent_id: null,
    name: "Block 1 (Fashion Design)",
    slug: "block-1",
    location_type: "building",
    description: "Academic building for School of Fashion Design.",
    latitude: 31.258646,
    longitude: 75.708691,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "8c8e5974-3a29-51f1-a0d7-0ebac1696028",
    parent_id: null,
    name: "CC Food Court",
    slug: "cc-food-court",
    location_type: "service",
    description: "Multi-cuisine food court and student social dining hub.",
    latitude: 31.257773,
    longitude: 75.708166,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "5bfe98ef-be02-5e1f-8255-a0bc5e1a123f",
    parent_id: null,
    name: "Block 2",
    slug: "block-2",
    location_type: "building",
    description: "Academic block adjacent to Central Spine.",
    latitude: 31.257531,
    longitude: 75.707387,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "d1aa0fc5-3fa4-5b5d-a21d-e0b268b2eac4",
    parent_id: null,
    name: "Tracer",
    slug: "tracer",
    location_type: "landmark",
    description: "Prominent navigational landmark along South Corridor.",
    latitude: 31.256946,
    longitude: 75.707421,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "8e89fbb3-e7e2-5403-912f-987dd1516db9",
    parent_id: null,
    name: "Block 8 (8A & 8B)",
    slug: "block-8",
    location_type: "building",
    description: "Integrated academic facility housing engineering disciplines.",
    latitude: 31.2569166667,
    longitude: 75.7070833333,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "a76b20ec-ae67-599b-a6d6-70e3cfa09d7e",
    parent_id: null,
    name: "Block 8C (Product and Industrial Block)",
    slug: "block-8c",
    location_type: "building",
    description: "School of Product and Industrial Design studios.",
    latitude: 31.256681,
    longitude: 75.706516,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "f83db54b-d7aa-5fe1-8179-1bf48eb6c340",
    parent_id: null,
    name: "GH2 Security Office",
    slug: "gh-2-security-office",
    location_type: "service",
    description: "Residential reception and visitor sign-in point.",
    latitude: 31.256919,
    longitude: 75.706063,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "bc72797b-bb66-508a-b85f-8919f187a536",
    parent_id: null,
    name: "Girls Hostel 2 (GH-2)",
    slug: "gh-2",
    location_type: "hostel",
    description: "Multi-storey student residential facility.",
    latitude: 31.256989,
    longitude: 75.706048,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
  {
    id: "3e551f33-146d-5573-bf08-e21509a25ce2",
    parent_id: null,
    name: "MB Food Square",
    slug: "mb-food-square",
    location_type: "service",
    description: "Southern campus dining court and open-air plaza.",
    latitude: 31.256442,
    longitude: 75.708606,
    address_details: null,
    is_verified: true,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
  },
];

export const VERIFIED_DATASET_C_NODES: BackendNode[] = [
  { id: "e10cf672-0199-52bb-85bb-a0e28aa4eb52", location_id: "f3747ebc-e653-5694-8aa7-71b9be8b082e", node_type: "gate_entrance", latitude: 31.260565, longitude: 75.706815, is_accessible: true, is_active: true, survey_id: "G1-ENTRY" },
  { id: "b3f3b905-23c2-563b-bb57-b183dd2eb727", location_id: null, node_type: "junction", latitude: 31.259467, longitude: 75.706656, is_accessible: true, is_active: true, survey_id: "J-001" },
  { id: "33ebae14-3cfa-5ea7-8b09-cf875567b4dc", location_id: null, node_type: "junction", latitude: 31.25949, longitude: 75.707234, is_accessible: true, is_active: true, survey_id: "J-002" },
  { id: "bf5b00fb-e408-54b0-a3a8-a6fe40224b17", location_id: "0ecff5ec-1e56-57c1-b28f-66a9d1579d0d", node_type: "gate_entrance", latitude: 31.260193, longitude: 75.707385, is_accessible: true, is_active: true, survey_id: "HOSTEL-GATE-ENTRY" },
  { id: "d632fe24-9b88-5188-beee-01f7ccbc7855", location_id: "6e078c8a-78f9-58b4-934c-6fa103ef8081", node_type: "parking_entrance", latitude: 31.259424, longitude: 75.705887, is_accessible: true, is_active: true, survey_id: "MAIN-GATE-PARKING" },
  { id: "9b3b8ef4-6f09-5487-b089-a2e6fca7aa83", location_id: "c2986647-380f-569c-be37-8f4694f176c8", node_type: "landmark", latitude: 31.258994, longitude: 75.706935, is_accessible: true, is_active: true, survey_id: "BALDEV-RAJ-MITTAL-PARK" },
  { id: "1be5521b-cfc1-5be0-b98a-2ea07d0842db", location_id: null, node_type: "junction", latitude: 31.258618, longitude: 75.706667, is_accessible: true, is_active: true, survey_id: "J-003" },
  { id: "ca80c5ba-87b6-5838-8e68-0fb853e817c7", location_id: null, node_type: "junction", latitude: 31.25861, longitude: 75.707202, is_accessible: true, is_active: true, survey_id: "J-004" },
  { id: "28e7ebad-58dc-5fa4-9bc0-04374a520ca4", location_id: "614fc2a0-ea37-5ea0-a92c-623bb66c1b3f", node_type: "building_entrance", latitude: 31.258222, longitude: 75.706861, is_accessible: true, is_active: true, survey_id: "UNIVERSITY-HOSPITAL" },
  { id: "f3743cfa-3ef9-5415-9963-c7e6caee2751", location_id: "eb28842b-ae3a-5900-9e8c-8f23788fffa9", node_type: "building_entrance", latitude: 31.25831, longitude: 75.707822, is_accessible: true, is_active: true, survey_id: "BALDEV-RAJ-MITTAL-AUDITORIUM" },
  { id: "04bcbf69-9069-52e6-a831-e1f9a2b535d8", location_id: "66fcfa57-ea5c-5154-8e7c-87d1ea21a41b", node_type: "building_entrance", latitude: 31.258646, longitude: 75.708691, is_accessible: true, is_active: true, survey_id: "BLOCK-1-FASHION-DESIGN" },
  { id: "6c656e18-6ef1-5a5f-9bf7-cf3e8e2eb3c4", location_id: null, node_type: "junction", latitude: 31.258138, longitude: 75.70761, is_accessible: true, is_active: true, survey_id: "J-005" },
  { id: "65e21975-d85c-535d-a51f-6a757eb7cf2a", location_id: null, node_type: "junction", latitude: 31.257736, longitude: 75.707627, is_accessible: true, is_active: true, survey_id: "J-006" },
  { id: "d6f932e6-c116-5593-ba52-5a21ffcc348a", location_id: null, node_type: "junction", latitude: 31.257144, longitude: 75.707564, is_accessible: true, is_active: true, survey_id: "J-007" },
  { id: "88931168-3e46-5c5a-b97c-9b19f07755b4", location_id: "8c8e5974-3a29-51f1-a0d7-0ebac1696028", node_type: "building_entrance", latitude: 31.257773, longitude: 75.708166, is_accessible: true, is_active: true, survey_id: "CC-FOOD-COURT" },
  { id: "28e078ec-2a6d-55c0-a7d1-e6e78ba727df", location_id: "5bfe98ef-be02-5e1f-8255-a0bc5e1a123f", node_type: "building_entrance", latitude: 31.257531, longitude: 75.707387, is_accessible: true, is_active: true, survey_id: "BLOCK-2" },
  { id: "da17ef1e-e274-569d-83cb-1b07be6cbbe9", location_id: null, node_type: "junction", latitude: 31.257115, longitude: 75.707091, is_accessible: true, is_active: true, survey_id: "J-008" },
  { id: "6c9d0fa7-b847-5d25-96c2-ceea798bbcfc", location_id: null, node_type: "junction", latitude: 31.25707, longitude: 75.706619, is_accessible: true, is_active: true, survey_id: "J-009" },
  { id: "a5ad8f61-ba1b-5353-8472-fc37c02b9e4a", location_id: "d1aa0fc5-3fa4-5b5d-a21d-e0b268b2eac4", node_type: "building_entrance", latitude: 31.256946, longitude: 75.707421, is_accessible: true, is_active: true, survey_id: "TRACER" },
  { id: "7a262446-c564-5858-a3f8-65aa79685121", location_id: "8e89fbb3-e7e2-5403-912f-987dd1516db9", node_type: "building_entrance", latitude: 31.2569166667, longitude: 75.7070833333, is_accessible: true, is_active: true, survey_id: "BLOCK-8" },
  { id: "9fe1b920-aa95-5cb7-9759-b141459a9dbf", location_id: null, node_type: "junction", latitude: 31.256792, longitude: 75.706429, is_accessible: true, is_active: true, survey_id: "J-010" },
  { id: "51f11a43-ea3b-55c3-a3d1-4db8a2b5aa5d", location_id: "a76b20ec-ae67-599b-a6d6-70e3cfa09d7e", node_type: "building_entrance", latitude: 31.256681, longitude: 75.706516, is_accessible: true, is_active: true, survey_id: "BLOCK-8C" },
  { id: "1059f8a3-2ea6-5776-8ef3-d6c44917955c", location_id: "f83db54b-d7aa-5fe1-8179-1bf48eb6c340", node_type: "building_entrance", latitude: 31.256919, longitude: 75.706063, is_accessible: true, is_active: true, survey_id: "GH2-SECURITY-OFFICE" },
  { id: "77bbbf67-ee12-51f6-a832-6bf50e1a123e", location_id: "bc72797b-bb66-508a-b85f-8919f187a536", node_type: "building_entrance", latitude: 31.256989, longitude: 75.706048, is_accessible: true, is_active: true, survey_id: "GH-2" },
  { id: "cf68e826-b99b-5777-a859-f2334f6ba6a0", location_id: null, node_type: "junction", latitude: 31.256366, longitude: 75.706299, is_accessible: true, is_active: true, survey_id: "J-011" },
  { id: "3746654f-aa92-54b1-85b2-32b0d2d790e1", location_id: "3e551f33-146d-5573-bf08-e21509a25ce2", node_type: "building_entrance", latitude: 31.256442, longitude: 75.708606, is_accessible: true, is_active: true, survey_id: "MB-FOOD-SQUARE" },
  { id: "c18ea698-fa24-5d5d-9b5a-4b953a3aa539", location_id: null, node_type: "junction", latitude: 31.256142, longitude: 75.706096, is_accessible: true, is_active: true, survey_id: "J-012" },
];

export const VERIFIED_DATASET_C_SEGMENTS = [
  { id: "P-001", from: "G1-ENTRY", to: "J-001", distance_m: 123.0 },
  { id: "P-002", from: "J-001", to: "J-002", distance_m: 55.0 },
  { id: "P-003", from: "J-002", to: "HOSTEL-GATE-ENTRY", distance_m: 79.5 },
  { id: "P-004", from: "MAIN-GATE-PARKING", to: "J-001", distance_m: 73.3 },
  { id: "P-005", from: "J-001", to: "BALDEV-RAJ-MITTAL-PARK", distance_m: 58.9 },
  { id: "P-006", from: "J-001", to: "J-003", distance_m: 94.4 },
  { id: "P-007", from: "J-003", to: "UNIVERSITY-HOSPITAL", distance_m: 47.7 },
  { id: "P-008", from: "J-003", to: "J-004", distance_m: 50.9 },
  { id: "P-009", from: "J-004", to: "UNIVERSITY-HOSPITAL", distance_m: 53.9 },
  { id: "P-010", from: "J-004", to: "BALDEV-RAJ-MITTAL-AUDITORIUM", distance_m: 67.7 },
  { id: "P-011", from: "J-004", to: "BLOCK-1-FASHION-DESIGN", distance_m: 141.6 },
  { id: "P-012", from: "BALDEV-RAJ-MITTAL-AUDITORIUM", to: "BLOCK-1-FASHION-DESIGN", distance_m: 90.7 },
  { id: "P-013", from: "J-004", to: "J-005", distance_m: 65.3 },
  { id: "P-014", from: "BALDEV-RAJ-MITTAL-AUDITORIUM", to: "J-005", distance_m: 27.8 },
  { id: "P-015", from: "J-006", to: "J-007", distance_m: 66.1 },
  { id: "P-016", from: "J-006", to: "CC-FOOD-COURT", distance_m: 51.4 },
  { id: "P-017", from: "J-006", to: "BLOCK-2", distance_m: 32.2 },
  { id: "P-018", from: "J-007", to: "J-008", distance_m: 45.1 },
  { id: "P-019", from: "J-003", to: "J-009", distance_m: 172.2 },
  { id: "P-020", from: "J-007", to: "TRACER", distance_m: 25.9 },
  { id: "P-021", from: "J-008", to: "BLOCK-8", distance_m: 22.1 },
  { id: "P-022", from: "J-009", to: "J-010", distance_m: 35.8 },
  { id: "P-023", from: "J-010", to: "BLOCK-8C", distance_m: 14.9 },
  { id: "P-024", from: "J-010", to: "GH2-SECURITY-OFFICE", distance_m: 37.5 },
  { id: "P-025", from: "J-010", to: "GH-2", distance_m: 42.3 },
  { id: "P-026", from: "J-010", to: "J-011", distance_m: 49.0 },
  { id: "P-027", from: "J-011", to: "MB-FOOD-SQUARE", distance_m: 219.5 },
  { id: "P-028", from: "J-011", to: "J-012", distance_m: 31.5 },
  { id: "P-029", from: "J-008", to: "J-009", distance_m: 45.1 },
];

/**
 * Standard public locations mapped for frontend consumption.
 */
export const SAMPLE_LOCATIONS: CampusLocation[] = VERIFIED_DATASET_C_LOCATIONS.map(mapBackendToFrontend);
