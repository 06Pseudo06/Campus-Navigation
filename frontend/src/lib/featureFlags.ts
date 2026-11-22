/**
 * Runtime feature flags. Defaults ON unless explicitly set to "false".
 * Disable quickly in .env.local: NEXT_PUBLIC_FEATURE_GPS=false
 */
export const FEATURE_GPS = process.env.NEXT_PUBLIC_FEATURE_GPS !== "false";
export const FEATURE_QR = process.env.NEXT_PUBLIC_FEATURE_QR !== "false";
export const IS_DEV = process.env.NODE_ENV !== "production";
