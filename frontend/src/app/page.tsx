import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { SectionProvider } from "@/context/SectionContext";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { ArchitecturalHero } from "@/components/home/ArchitecturalHero";
import { MarqueeSection } from "@/components/home/MarqueeSection";
import { InteractiveFeaturesSection } from "@/components/home/InteractiveFeaturesSection";
import { MapPreviewSection } from "@/components/home/MapPreviewSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { CampusGallerySection } from "@/components/home/CampusGallerySection";
import { ClosingCtaSection } from "@/components/home/ClosingCtaSection";
import { EditorialFooter } from "@/components/home/EditorialFooter";

export const metadata: Metadata = {
  title: "CampusWay — University Navigation & Wayfinding",
  description:
    "Discover destinations, plan smarter routes, and experience Lovely Professional University with architectural clarity.",
};

export default function Home() {
  return (
    <SectionProvider>
      <div className="relative w-full min-h-screen flex flex-col bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 overflow-x-hidden selection:bg-[#DE4B31] selection:text-white transition-colors duration-200">
        {/* Custom Terracotta Interactive Cursor */}
        <CustomCursor />

        {/* Global Scroll Progress Bar & Left Vertical Index */}
        <ScrollProgress />

        {/* 1. Persistent Architectural Navbar with Theme Toggle */}
        <Navbar />

        <main className="relative w-full flex flex-col">
          {/* SECTION 01: ARCHITECTURAL HERO */}
          <ArchitecturalHero />

          {/* SECTION: MARQUEE & STATS COUNTERS */}
          <MarqueeSection />

          {/* SECTION 02: WHAT YOU CAN DO (3-Card Editorial Row) */}
          <InteractiveFeaturesSection />

          {/* SECTION 03: REAL ROUTES. REAL CAMPUS. (Interactive 3D Map Card) */}
          <MapPreviewSection />

          {/* SECTION 04: HOW IT WORKS (4-Step Timeline Progression) */}
          <HowItWorksSection />

          {/* SECTION 05: CAMPUS ARCHITECTURAL ATLAS (12-Column Curated Grid & Lightbox) */}
          <CampusGallerySection />

          {/* SECTION 06: FINAL CALL TO ACTION */}
          <ClosingCtaSection />
        </main>

        {/* EDITORIAL BOXED FOOTER WITH WATERMARK */}
        <EditorialFooter />
      </div>
    </SectionProvider>
  );
}
