import React from "react";
import type { Metadata } from "next";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { ArchitecturalHero } from "@/components/home/ArchitecturalHero";
import { ArchitecturalTransition } from "@/components/home/ArchitecturalTransition";
import { EditorialStorytelling } from "@/components/home/EditorialStorytelling";
import { MapPreviewSection } from "@/components/home/MapPreviewSection";
import { ClosingCtaSection } from "@/components/home/ClosingCtaSection";
import { EditorialFooter } from "@/components/home/EditorialFooter";

export const metadata: Metadata = {
  title: "CampusWay — Campus Navigation & Route Intelligence",
  description:
    "A smarter way to discover spaces, navigate destinations and experience your university campus with architectural clarity.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-[#FBF9F5] text-[#111111] overflow-x-hidden selection:bg-[#D9532F] selection:text-white font-sans">
      {/* 1. Minimal Floating Navigation Bar */}
      <EditorialNavbar />

      <main className="w-full flex flex-col">
        {/* 2. Cinematic Architectural Hero */}
        <ArchitecturalHero />

        {/* 3. Architectural Transition / Building Reveal & Campus Thesis */}
        <ArchitecturalTransition />

        {/* 4. Discover, Navigate and Remember Feature Storytelling */}
        <EditorialStorytelling />

        {/* 5. Real CampusWay Map and Routing Interactive Preview */}
        <MapPreviewSection />

        {/* 6. Closing Statement and Exploration CTA */}
        <ClosingCtaSection />
      </main>

      {/* 7. Minimal Architectural Footer */}
      <EditorialFooter />
    </div>
  );
}
