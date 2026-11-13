import React from "react";
import type { Metadata } from "next";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { ArchitecturalHero } from "@/components/home/ArchitecturalHero";
import { EditorialStorytelling } from "@/components/home/EditorialStorytelling";
import { MapPreviewSection } from "@/components/home/MapPreviewSection";
import { ClosingCtaSection } from "@/components/home/ClosingCtaSection";
import { EditorialFooter } from "@/components/home/EditorialFooter";

export const metadata: Metadata = {
  title: "CampusWay — Campus Wayfinding, Reimagined",
  description:
    "Discover destinations, plan smarter routes, and experience your university campus with confidence.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-[#F7F3ED] text-[#151515] overflow-x-hidden selection:bg-[#E6532E] selection:text-white font-sans">
      {/* Editorial Floating Navbar */}
      <EditorialNavbar />

      <main className="w-full flex flex-col">
        {/* 01 / CAMPUS WAYFINDING, REIMAGINED */}
        <ArchitecturalHero />

        {/* 02 / WHAT YOU CAN DO */}
        <EditorialStorytelling />

        {/* 03 / LIVE ROUTING */}
        <MapPreviewSection />

        {/* 04 / START EXPLORING */}
        <ClosingCtaSection />
      </main>

      {/* Editorial Footer */}
      <EditorialFooter />
    </div>
  );
}
