"use client";

import { AtlasSection } from "./atlas/AtlasSection";

/**
 * CampusGallerySection
 * 
 * Re-exports the refined AtlasSection for home page integration.
 */
export function CampusGallerySection() {
  return <AtlasSection />;
}

export { AtlasSection } from "./atlas/AtlasSection";
export { AtlasCard } from "./atlas/AtlasCard";
export { StepIndicator } from "./atlas/StepIndicator";
export { AtlasCursor } from "./atlas/AtlasCursor";
