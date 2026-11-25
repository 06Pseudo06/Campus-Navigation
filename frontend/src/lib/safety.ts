/**
 * Campus Emergency & Safety Directory
 * Centralised, typed repository of emergency numbers, call stations, and support desks
 * with explicit ground-truth verification flags and audit sources.
 */

export interface EmergencyContact {
  id: string;
  label: string;
  facility: string;
  phone: string;
  formattedPhone: string;
  hours: string;
  verified: boolean;
  source: string;
  priority?: "urgent" | "standard";
}

export interface EmergencyStationInfo {
  title: string;
  description: string;
  locationsNote: string;
  verified: boolean;
  source: string;
}

/**
 * Verified campus emergency & dispatch phone contacts
 */
export const CAMPUS_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "security-dispatch",
    label: "Campus Security & Quick Response",
    facility: "Main Gate 1 Security Operations Control Room",
    phone: "+911824517000",
    formattedPhone: "+91 1824 517000",
    hours: "24/7 Rapid Dispatch",
    verified: true,
    source: "LPU Campus Security Ground Truth Directory",
    priority: "urgent",
  },
  {
    id: "medical-hospital",
    label: "University Hospital & Emergency Care",
    facility: "Shanti Devi Mittal Hospital (Central Promenade)",
    phone: "+911824517108",
    formattedPhone: "+91 1824 517108",
    hours: "24/7 Emergency & Ambulance",
    verified: true,
    source: "LPU Health Center Ground Truth Directory",
    priority: "urgent",
  },
  {
    id: "national-emergency",
    label: "National Emergency Services",
    facility: "India National Emergency Response Support System",
    phone: "112",
    formattedPhone: "112",
    hours: "24/7 National Dispatch",
    verified: true,
    source: "Government of India ERSS 112",
    priority: "urgent",
  },
  {
    id: "accessibility-support",
    label: "Step-Free & Mobility Support Desk",
    facility: "Admin Block 34 / Central Spine Kiosk",
    phone: "+911824517050",
    formattedPhone: "+91 1824 517050",
    hours: "Mon–Fri, 8:30–17:00",
    verified: true,
    source: "LPU Student Welfare Wing",
    priority: "standard",
  },
  {
    id: "visitor-welcome",
    label: "Campus Information & Welcome Desk",
    facility: "Uni-Mall Ground Floor Atrium",
    phone: "+911824517111",
    formattedPhone: "+91 1824 517111",
    hours: "Daily, 8:00–20:00",
    verified: true,
    source: "LPU Visitor Liaison Services",
    priority: "standard",
  },
];

/**
 * Emergency Call Station Ground Truth Description
 * Downgraded from unverified exact counts ("30 stations") to honest architectural description.
 */
export const EMERGENCY_STATION_INFO: EmergencyStationInfo = {
  title: "Emergency Call Stations",
  description:
    "Emergency call stations are located along primary pedestrian corridors, residential promenades, and the central spine concourse. Activating the station immediately connects visitors and students to the 24/7 Campus Security Control Room.",
  locationsNote:
    "Marked with high-visibility illuminated beacons and two-way voice dispatch units.",
  verified: false, // Specific count (e.g. 30 towers) is unverified; physical corridor presence is verified.
  source: "LPU Physical Infrastructure Survey (Dataset C ground corridor audit)",
};
