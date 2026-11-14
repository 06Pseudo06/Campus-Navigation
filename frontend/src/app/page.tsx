import React from "react";
import type { Metadata } from "next";
import { PageIntro } from "@/components/motion/PageIntro";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { ArchitecturalHero } from "@/components/home/ArchitecturalHero";
import { MarqueeSection } from "@/components/home/MarqueeSection";
import { InteractiveFeaturesSection } from "@/components/home/InteractiveFeaturesSection";
import { MapPreviewSection } from "@/components/home/MapPreviewSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { CampusGallerySection } from "@/components/home/CampusGallerySection";
import { ClosingCtaSection } from "@/components/home/ClosingCtaSection";
import { EditorialFooter } from "@/components/home/EditorialFooter";

import { SectionProvider } from "@/context/SectionContext";

export const metadata: Metadata = {
  title: "CampusWay — Campus Wayfinding, Reimagined",
  description:
    "Discover destinations, plan smarter routes, and experience your university campus with architectural clarity.",
};

export default function Home() {
  return (
    <SectionProvider>
      <SmoothScroll>
        {/* 1. Page Load Intro Animation (~1.6s) */}
        <PageIntro />

        {/* 2. Interactive Custom Cursor (Desktop only, lerped ring + contextual labels) */}
        <CustomCursor />

        {/* 3. Global Scroll Progress (Top Line + Left Vertical 01-06 Index) */}
        <ScrollProgress />

        {/* 4. Film Grain Fixed Overlay (2-3% Subtle Texture) */}
        <div className="film-grain-overlay" aria-hidden="true" />

        {/* 5. Fixed Editorial Navbar (Adapts on dark sections) */}
        <EditorialNavbar />

        <main className="relative w-full flex flex-col bg-[#F7F3EC] text-[#111111] overflow-x-hidden">
          {/* SECTION 01: HERO */}
          <ArchitecturalHero />

          {/* MARQUEE & METRICS COUNTERS STRIP */}
          <MarqueeSection />

          {/* SECTION 02: WHAT YOU CAN DO (3-Card Editorial Row) */}
          <InteractiveFeaturesSection />

          {/* SECTION 03: REAL ROUTES. REAL CAMPUS. (Interactive 3D Map Card) */}
          <MapPreviewSection />

          {/* SECTION 04: HOW IT WORKS (Pinned Horizontal Timeline) */}
          <HowItWorksSection />

          {/* SECTION 05: CAMPUS ARCHITECTURAL ATLAS (12-Column Dense Grid) */}
          <CampusGallerySection />

          {/* SECTION 06: FINAL CALL TO ACTION (Dusk Photography & Magnetic CTA) */}
          <ClosingCtaSection />
        </main>

        {/* Unnumbered Editorial Boxed Footer with Rising Wordmark */}
        <EditorialFooter />
      </SmoothScroll>
    </SectionProvider>
  );
}
