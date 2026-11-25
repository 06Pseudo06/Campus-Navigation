import React from "react";
import {
  type LucideIcon,
  type LucideProps,
  LayoutGrid,
  GraduationCap,
  BedDouble,
  DoorOpen,
  UtensilsCrossed,
  MapPin,
  MapPinOff,
  Navigation,
  CircleDot,
  Footprints,
  Accessibility,
  AlertTriangle,
  Lightbulb,
  Compass,
  CornerDownRight,
  FlaskConical,
  Flashlight,
  Camera,
  Upload,
  Layers,
  Ruler,
  Map,
  Search,
  X,
  Route,
  Check,
  Share2,
  Bookmark,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Info,
  Phone,
  ShieldCheck,
  LocateFixed,
  Eye,
  EyeOff,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";

export type IconSize = 14 | 16 | 18 | 20 | 24 | 28 | 32 | number;

export const iconMap = {
  // Navigation & Category icons
  all: LayoutGrid,
  academic: GraduationCap,
  building: GraduationCap,
  hostel: BedDouble,
  gate: DoorOpen,
  service: UtensilsCrossed,
  landmark: MapPin,
  pin: MapPin,
  pinOff: MapPinOff,
  startPin: CircleDot,
  destPin: Navigation,
  navigation: Navigation,
  route: Route,

  // Mode toggles & Directions
  walking: Footprints,
  accessible: Accessibility,
  step: Footprints,
  turn: CornerDownRight,
  compass: Compass,
  stairs: AlertTriangle,
  warning: AlertTriangle,
  alertTriangle: AlertTriangle,
  hint: Lightbulb,

  // Map controls & Engine
  layers: Layers,
  ruler: Ruler,
  map: Map,
  test: FlaskConical,
  locate: LocateFixed,

  // Tools & Modals
  search: Search,
  close: X,
  check: Check,
  share: Share2,
  bookmark: Bookmark,
  sparkles: Sparkles,
  clock: Clock,
  arrowRight: ArrowRight,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  info: Info,
  phone: Phone,
  shield: ShieldCheck,
  eye: Eye,
  eyeOff: EyeOff,
  qrCode: QrCode,
  flashlight: Flashlight,
  camera: Camera,
  upload: Upload,
  filter: SlidersHorizontal,
} as const;

export type IconName = keyof typeof iconMap;

export interface IconProps extends Omit<LucideProps, "size"> {
  /**
   * Named icon key from central typed iconMap
   */
  name?: IconName;
  /**
   * Explicit LucideIcon component reference
   */
  icon?: LucideIcon;
  /**
   * Standardized icon size in pixels: default 20
   */
  size?: IconSize;
  /**
   * Stroke width: default 1.75 for CampusWay architectural visual weight
   */
  strokeWidth?: number;
  /**
   * Additional Tailwind class names (e.g. text color tokens)
   */
  className?: string;
  /**
   * Accessible description; if omitted, marks icon as aria-hidden
   */
  "aria-label"?: string;
}

/**
 * Standardized CampusWay Icon Component.
 * Guarantees consistent stroke width (1.75), size scale, and currentColor token styling.
 */
export function Icon({
  name,
  icon,
  size = 20,
  strokeWidth = 1.75,
  className = "",
  "aria-label": ariaLabel,
  ...rest
}: IconProps) {
  const IconComponent: LucideIcon | undefined = icon || (name ? iconMap[name] : undefined);

  if (!IconComponent) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Icon] Unknown icon name: "${name}" and no icon component provided.`);
    }
    return null;
  }

  const isAccessible = Boolean(ariaLabel);

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={`inline-block shrink-0 ${className}`}
      aria-hidden={isAccessible ? undefined : true}
      aria-label={ariaLabel}
      role={isAccessible ? "img" : "presentation"}
      {...rest}
    />
  );
}

export default Icon;
