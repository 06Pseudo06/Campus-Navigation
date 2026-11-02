import { CampusLocation } from "@/types/campus";

/**
 * CampusWay Sample Demonstration Dataset
 * 
 * NOTE: This is clearly marked mock data for frontend demonstration and prototyping.
 * It does NOT represent a real university campus and will be replaced by
 * FastAPI campus map endpoints in future phases.
 */

export const SAMPLE_LOCATIONS: CampusLocation[] = [
  {
    id: "loc-main-gate",
    name: "Main Gate",
    code: "GATE-01",
    category: "gate",
    description: "Primary campus entrance with visitor check-in, security kiosk, and bus transit hub.",
    coordinates: { x: 50, y: 92 },
    buildingShape: { x: 44, y: 90, width: 12, height: 4, radius: 2, color: "#10b981" },
    operatingHours: "24/7 Security Access",
    accessibility: "Wheelchair accessible with wide tactile entry pavement",
    popular: true,
  },
  {
    id: "loc-north-gate",
    name: "North Gate",
    code: "GATE-02",
    category: "gate",
    description: "Secondary entrance adjacent to North Parking and Science Quad.",
    coordinates: { x: 50, y: 8 },
    buildingShape: { x: 44, y: 6, width: 12, height: 4, radius: 2, color: "#10b981" },
    operatingHours: "06:00 AM - 10:00 PM",
    accessibility: "Ramped automated pedestrian gate",
    popular: false,
  },
  {
    id: "loc-south-gate",
    name: "South Gate",
    code: "GATE-03",
    category: "gate",
    description: "Pedestrian entrance connecting south residential halls and sports grounds.",
    coordinates: { x: 18, y: 88 },
    buildingShape: { x: 14, y: 86, width: 8, height: 4, radius: 2, color: "#10b981" },
    operatingHours: "07:00 AM - 09:00 PM",
    accessibility: "Ground level level-paved entrance",
    popular: false,
  },
  {
    id: "loc-block-34",
    name: "Block 34",
    code: "B-34",
    category: "building",
    description: "Multi-disciplinary academic complex housing computer laboratories, smart lecture halls, and dean offices.",
    coordinates: { x: 68, y: 44 },
    buildingShape: { x: 62, y: 38, width: 16, height: 14, radius: 4, color: "#DE4B31" },
    floors: "Ground Floor + 4 Floors",
    operatingHours: "07:30 AM - 09:30 PM",
    facilities: ["Elevators (East & West Wings)", "Smart Classrooms", "High-speed Wi-Fi", "IoT Innovation Lab"],
    departments: ["Information Technology", "Cybersecurity", "Applied Mathematics"],
    accessibility: "Dual ADA ramps at Main East entry, tactile elevator buttons, accessible restrooms on all floors",
    popular: true,
  },
  {
    id: "loc-block-25",
    name: "Block 25",
    code: "B-25",
    category: "building",
    description: "Computer Science and Artificial Intelligence research wing with collaborative project studios.",
    coordinates: { x: 32, y: 44 },
    buildingShape: { x: 26, y: 38, width: 14, height: 14, radius: 4, color: "#3B82F6" },
    floors: "Ground Floor + 3 Floors",
    operatingHours: "08:00 AM - 10:00 PM",
    facilities: ["AI GPU Cluster Lab", "Robotics Arena", "Student Lounge", "Quiet Study Pods"],
    departments: ["Computer Science & Engineering", "Software Systems"],
    accessibility: "Accessible elevator, automatic double-sliding entrance doors",
    popular: true,
  },
  {
    id: "loc-library",
    name: "Central Library",
    code: "LIB-01",
    category: "building",
    description: "Five-story central academic repository with digital archives, silent study zones, and meeting carrels.",
    coordinates: { x: 50, y: 24 },
    buildingShape: { x: 42, y: 18, width: 16, height: 13, radius: 5, color: "#8B5CF6" },
    floors: "5 Floors + Basement Archives",
    operatingHours: "08:00 AM - Midnight (24/7 during Finals)",
    facilities: ["Digital Media Hub", "Quiet Reading Halls", "Book Lending Kiosk", "Cafe Corner"],
    accessibility: "Elevator access to all levels, braille-labelled stacks, height-adjustable desks",
    popular: true,
  },
  {
    id: "loc-engineering",
    name: "Engineering Block",
    code: "ENG-01",
    category: "building",
    description: "Mechanical workshops, electrical circuits lab, and civil structures design studios.",
    coordinates: { x: 80, y: 26 },
    buildingShape: { x: 74, y: 20, width: 14, height: 16, radius: 4, color: "#F59E0B" },
    floors: "Ground Floor + 3 Floors",
    operatingHours: "08:00 AM - 08:00 PM",
    facilities: ["CAD Modeling Studio", "Materials Testing Lab", "3D Prototyping Workshop"],
    departments: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering"],
    accessibility: "Ground-level heavy machinery access, wide freight elevator",
    popular: true,
  },
  {
    id: "loc-central-plaza",
    name: "Central Plaza",
    code: "PLZ-01",
    category: "landmark",
    description: "The heart of campus life featuring landscaped gardens, outdoor amphitheatre seating, and fountain.",
    coordinates: { x: 50, y: 55 },
    buildingShape: { x: 44, y: 50, width: 12, height: 11, radius: 6, color: "#059669" },
    operatingHours: "Open Always",
    facilities: ["Open-air Wi-Fi", "Solar Charging Benches", "Information Boards", "Campus Water Fountain"],
    accessibility: "Completely flat paved promenade with zero-threshold paths",
    popular: true,
  },
  {
    id: "loc-cafeteria",
    name: "Campus Cafeteria & Food Court",
    code: "CAF-01",
    category: "service",
    description: "Multi-cuisine dining hall with indoor and terrace seating, coffee kiosks, and juice bars.",
    coordinates: { x: 30, y: 70 },
    buildingShape: { x: 23, y: 64, width: 16, height: 12, radius: 4, color: "#EC4899" },
    floors: "2 Floors (Main Dining & Mezzanine Cafe)",
    operatingHours: "07:30 AM - 10:00 PM",
    facilities: ["Multiple Food Counters", "Grab & Go Station", "Filtered Water Refills", "Outdoor Patio"],
    accessibility: "Wide aisles between seating, step-free access, wheelchair-height counters",
    popular: true,
  },
  {
    id: "loc-admin",
    name: "Admin Block",
    code: "ADM-01",
    category: "building",
    description: "Registrar, admissions, financial aid, international student support, and chancellor's suite.",
    coordinates: { x: 70, y: 70 },
    buildingShape: { x: 63, y: 64, width: 15, height: 13, radius: 4, color: "#6366F1" },
    floors: "Ground Floor + 2 Floors",
    operatingHours: "09:00 AM - 05:00 PM (Mon-Fri)",
    facilities: ["Student Help Desk", "Cashier Counter", "Document Attestation", "Visitor Lounge"],
    accessibility: "Ramped entrance with automatic power doors and ADA elevator",
    popular: true,
  },
  {
    id: "loc-sports",
    name: "Sports Complex",
    code: "SPT-01",
    category: "building",
    description: "Indoor sports arena, gym, Olympic swimming pool, badminton courts, and stadium field.",
    coordinates: { x: 16, y: 25 },
    buildingShape: { x: 10, y: 18, width: 16, height: 16, radius: 4, color: "#14B8A6" },
    floors: "2 Floors + Outdoor Track",
    operatingHours: "06:00 AM - 09:30 PM",
    facilities: ["Fitness Gymnasium", "Indoor Basketball Court", "Locker Rooms", "First Aid Room"],
    accessibility: "Zero-barrier access to courts, poolside wheelchair lift",
    popular: false,
  },
  {
    id: "loc-parking-main",
    name: "Visitor & Faculty Parking",
    code: "PKG-01",
    category: "service",
    description: "Designated visitor parking bays, EV charging points, and two-wheeler parking lanes.",
    coordinates: { x: 78, y: 88 },
    buildingShape: { x: 72, y: 84, width: 14, height: 8, radius: 3, color: "#64748B" },
    operatingHours: "24/7 Security Monitored",
    facilities: ["4x Fast EV Chargers", "Designated Accessible Bays", "Pay-on-Exit Kiosks"],
    accessibility: "Reserved accessible parking bays immediately adjacent to walkway",
    popular: false,
  },
  {
    id: "loc-parking-north",
    name: "North Student Parking",
    code: "PKG-02",
    category: "service",
    description: "Spacious surface parking lot serving students visiting Science Quad and Central Library.",
    coordinates: { x: 22, y: 8 },
    buildingShape: { x: 16, y: 6, width: 14, height: 6, radius: 3, color: "#64748B" },
    operatingHours: "06:00 AM - 11:00 PM",
    facilities: ["Bicycle Racks", "EV Charging", "Emergency Call Box"],
    accessibility: "Level tarmac with marked pedestrian walkways",
    popular: false,
  },
  // Sub-locations / Rooms
  {
    id: "room-3402",
    name: "Room 3402 — Main Seminar Hall",
    code: "RM-3402",
    category: "room",
    parentBuildingId: "loc-block-34",
    description: "Tiered 180-seat auditorium equipped with 4K projection, speaker podium, and lecture recording.",
    coordinates: { x: 69, y: 43 },
    floors: "Block 34, 2nd Floor",
    operatingHours: "Scheduled during class hours",
    facilities: ["A/V Console", "Lapel Microphones", "Assisted Listening Devices"],
    accessibility: "Dedicated wheelchair seating in front and mid rows, elevator to 2nd floor",
    popular: true,
  },
  {
    id: "room-2505",
    name: "Room 2505 — Robotics & AI Lab",
    code: "RM-2505",
    category: "room",
    parentBuildingId: "loc-block-25",
    description: "Advanced prototyping lab featuring autonomous rover test tracks, robotic arms, and 3D vision systems.",
    coordinates: { x: 33, y: 43 },
    floors: "Block 25, 1st Floor",
    operatingHours: "09:00 AM - 07:00 PM",
    facilities: ["Safety Stations", "Soldering Benches", "Test Arena"],
    accessibility: "Wheelchair accessible workbenches with adjustable heights",
    popular: false,
  },
  {
    id: "room-eng-102",
    name: "Room E-102 — CAD Design Studio",
    code: "RM-E102",
    category: "room",
    parentBuildingId: "loc-engineering",
    description: "60-workstation engineering computer lab with Siemens NX, AutoCAD, and SolidWorks licenses.",
    coordinates: { x: 81, y: 25 },
    floors: "Engineering Block, Ground Floor",
    operatingHours: "08:30 AM - 06:30 PM",
    facilities: ["Dual 4K Monitors", "Plotter Printing", "Instructor Display"],
    accessibility: "Ground floor location with zero steps from main corridor",
    popular: false,
  },
  {
    id: "room-lib-silent",
    name: "Room L-301 — Silent Study Gallery",
    code: "RM-L301",
    category: "room",
    parentBuildingId: "loc-library",
    description: "Whisper-quiet study zone with individual cubicles, power outlets, and reading lamps.",
    coordinates: { x: 50, y: 23 },
    floors: "Central Library, 3rd Floor",
    operatingHours: "08:00 AM - Midnight",
    facilities: ["Individual Power Outlets", "Ergonomic Chairs", "Individual Lamps"],
    accessibility: "Accessible via Central Library elevators",
    popular: true,
  },
  // Additional landmark
  {
    id: "loc-clock-tower",
    name: "Campus Clock Tower & Bell",
    code: "TWR-01",
    category: "landmark",
    description: "Historic 1968 brick bell tower chiming on the hour and serving as a popular campus meeting point.",
    coordinates: { x: 44, y: 34 },
    buildingShape: { x: 42, y: 32, width: 5, height: 5, radius: 2, color: "#DE4B31" },
    operatingHours: "Open Always",
    facilities: ["Meeting benches", "Night Illumination"],
    accessibility: "Paved viewing plaza with surrounding tactile pavers",
    popular: false,
  },
];

/**
 * Pre-defined recent search items for first-time dashboard presentation
 */
export const INITIAL_RECENT_DESTINATION_IDS = [
  "loc-block-34",
  "loc-library",
  "loc-cafeteria",
  "loc-admin",
];

/**
 * Demonstration Route between Main Gate and campus locations
 */
export function generateDemonstrationRoute(
  fromId: string = "loc-main-gate",
  toId: string = "loc-block-34"
) {
  const fromLoc = SAMPLE_LOCATIONS.find((l) => l.id === fromId) || SAMPLE_LOCATIONS[0];
  const toLoc = SAMPLE_LOCATIONS.find((l) => l.id === toId) || SAMPLE_LOCATIONS[3];

  // Route waypoints along campus walkway network
  const waypoints = [
    { x: fromLoc.coordinates.x, y: fromLoc.coordinates.y, label: "Main Gate Entry" },
    { x: 50, y: 82, label: "South Boulevard Walkway" },
    { x: 50, y: 68, label: "Central Promenade Junction" },
    { x: 58, y: 55, label: "Plaza East Connector" },
    { x: toLoc.coordinates.x, y: toLoc.coordinates.y, label: `${toLoc.name} Main Entrance` },
  ];

  // Calculate approximate distance based on coordinates
  const dx = Math.abs(toLoc.coordinates.x - fromLoc.coordinates.x);
  const dy = Math.abs(toLoc.coordinates.y - fromLoc.coordinates.y);
  const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 6.5); // approximate meters
  const minutes = Math.max(2, Math.round(dist / 70)); // ~70m per minute walking pace

  return {
    id: `route-${fromLoc.id}-${toLoc.id}`,
    fromLocationId: fromLoc.id,
    fromName: fromLoc.name,
    toLocationId: toLoc.id,
    toName: toLoc.name,
    distanceMeters: Math.max(120, dist),
    estimatedWalkingMinutes: minutes,
    isAccessible: true,
    waypoints,
    steps: [
      {
        instruction: `Depart ${fromLoc.name} heading north along the central pedestrian boulevard.`,
        distanceMeters: Math.round(dist * 0.3),
        direction: "straight" as const,
      },
      {
        instruction: "Continue past the Central Plaza fountains on your left.",
        distanceMeters: Math.round(dist * 0.4),
        direction: "straight" as const,
      },
      {
        instruction: `Turn toward the ${toLoc.name} walkway and take the ramped entrance.`,
        distanceMeters: Math.round(dist * 0.3),
        direction: "right" as const,
      },
      {
        instruction: `Arrive at ${toLoc.name} entrance. Elevators and reception are directly ahead.`,
        distanceMeters: 0,
        direction: "enter" as const,
      },
    ],
    isDemonstrationData: true,
  };
}
