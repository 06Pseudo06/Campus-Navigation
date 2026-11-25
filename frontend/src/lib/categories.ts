import {
  type LucideIcon,
  LayoutGrid,
  GraduationCap,
  BedDouble,
  DoorOpen,
  UtensilsCrossed,
  MapPin,
  Building2,
} from "lucide-react";
import type { LocationCategory } from "@/types/campus";
import type { IconName } from "@/components/ui/Icon";

export interface CategoryDefinition {
  id: LocationCategory | "all";
  label: string;
  icon: LucideIcon;
  iconName: IconName;
  /** Primary accent hex code for SVG pins, badges, and active states */
  color: string;
  /** Background tint class (neutral or 10-12% accent tint) */
  bgTint: string;
  /** Text color class for contrast */
  textTint: string;
  /** Border tint class */
  borderTint: string;
  /** Contrast badge class for count pills */
  badgeTint: string;
  /** Active / selected state classes */
  activeClasses: string;
}

export const CATEGORIES: Record<string, CategoryDefinition> = {
  all: {
    id: "all",
    label: "All",
    icon: LayoutGrid,
    iconName: "all",
    color: "#64748B",
    bgTint: "bg-slate-100 dark:bg-zinc-800",
    textTint: "text-slate-700 dark:text-zinc-200",
    borderTint: "border-slate-200 dark:border-zinc-700",
    badgeTint: "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300",
    activeClasses: "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold",
  },
  building: {
    id: "building",
    label: "Academic",
    icon: GraduationCap,
    iconName: "academic",
    color: "#DE4B31",
    bgTint: "bg-red-500/10 dark:bg-red-950/30",
    textTint: "text-[#E8452C] dark:text-red-400",
    borderTint: "border-[#E8452C]/25 dark:border-red-800/40",
    badgeTint: "bg-red-100 text-[#E8452C] dark:bg-red-900/40 dark:text-red-300",
    activeClasses: "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold",
  },
  hostel: {
    id: "hostel",
    label: "Hostels",
    icon: BedDouble,
    iconName: "hostel",
    color: "#3B82F6",
    bgTint: "bg-blue-500/10 dark:bg-blue-950/30",
    textTint: "text-blue-600 dark:text-blue-400",
    borderTint: "border-blue-500/25 dark:border-blue-800/40",
    badgeTint: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    activeClasses: "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold",
  },
  gate: {
    id: "gate",
    label: "Gates",
    icon: DoorOpen,
    iconName: "gate",
    color: "#10B981",
    bgTint: "bg-emerald-500/10 dark:bg-emerald-950/30",
    textTint: "text-emerald-600 dark:text-emerald-400",
    borderTint: "border-emerald-500/25 dark:border-emerald-800/40",
    badgeTint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    activeClasses: "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold",
  },
  service: {
    id: "service",
    label: "Food & Dining",
    icon: UtensilsCrossed,
    iconName: "service",
    color: "#EC4899",
    bgTint: "bg-pink-500/10 dark:bg-pink-950/30",
    textTint: "text-pink-600 dark:text-pink-400",
    borderTint: "border-pink-500/25 dark:border-pink-800/40",
    badgeTint: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    activeClasses: "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold",
  },
  landmark: {
    id: "landmark",
    label: "Landmarks",
    icon: MapPin,
    iconName: "landmark",
    color: "#F59E0B",
    bgTint: "bg-amber-500/10 dark:bg-amber-950/30",
    textTint: "text-amber-600 dark:text-amber-400",
    borderTint: "border-amber-500/25 dark:border-amber-800/40",
    badgeTint: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    activeClasses: "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold",
  },
  room: {
    id: "room",
    label: "Rooms",
    icon: Building2,
    iconName: "building",
    color: "#8B5CF6",
    bgTint: "bg-purple-500/10 dark:bg-purple-950/30",
    textTint: "text-purple-600 dark:text-purple-400",
    borderTint: "border-purple-500/25 dark:border-purple-800/40",
    badgeTint: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    activeClasses: "bg-[#E8452C] border-[#E8452C] text-white shadow-xs font-semibold",
  },
};

/**
 * Filter chip sequence for Explore / Destination panel (excluding "room", which is subsumed under Academic)
 */
export const CATEGORY_LIST: CategoryDefinition[] = [
  CATEGORIES.all,
  CATEGORIES.building,
  CATEGORIES.hostel,
  CATEGORIES.gate,
  CATEGORIES.service,
  CATEGORIES.landmark,
];

/**
 * Fallback-safe category lookup
 */
export function getCategoryConfig(category?: string | null): CategoryDefinition {
  if (!category) return CATEGORIES.all;
  const key = category.trim().toLowerCase();
  return CATEGORIES[key] || CATEGORIES.building;
}

/**
 * Map of category hex colors for Mapbox markers and layers
 */
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  gate: CATEGORIES.gate.color,
  building: CATEGORIES.building.color,
  service: CATEGORIES.service.color,
  landmark: CATEGORIES.landmark.color,
  hostel: CATEGORIES.hostel.color,
  room: CATEGORIES.room.color,
};
