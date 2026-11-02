import React from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { CampusWayLogo } from "@/components/icons/Icons";
import { HeroCta } from "@/components/home/HeroCta";

export const metadata: Metadata = {
  title: "CampusWay — Campus Navigation & Wayfinding",
  description:
    "Helping first-time visitors and students find campus buildings, gates, rooms, and landmarks with intelligent wayfinding.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-[#DE4B31] selection:text-white">
      {/* Background Photography with Dark Contrast Overlay */}
      <div className="fixed inset-0 -z-10 w-full h-full">
        <Image
          src="/images/campus-bg.jpg"
          alt="Modern university campus architecture illuminated during dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transform motion-safe:transition-transform motion-safe:duration-1000"
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70" />
      </div>

      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-20 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-[1.1]">
            Find your place. <br />
            <span className="font-semibold text-white drop-shadow-md">
              Navigate with confidence.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/80 font-light leading-relaxed max-w-2xl">
            CampusWay helps university students, faculty, and first-time visitors discover campus gates, departments, lecture halls, and facilities with step-by-step guidance.
          </p>

          {/* Action CTAs */}
          <HeroCta />
        </div>

        {/* Feature Teasers */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 text-white space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#DE4B31]/30 border border-[#DE4B31]/50 flex items-center justify-center text-white text-sm font-bold">
              01
            </div>
            <h2 className="text-base font-semibold text-white">Campus Map Service</h2>
            <p className="text-xs text-white/70 leading-relaxed">
              Interactive 2D/3D building layouts, entry gates, accessibility paths, and facilities.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 text-white space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm font-bold">
              02
            </div>
            <h2 className="text-base font-semibold text-white">Route Planning Service</h2>
            <p className="text-xs text-white/70 leading-relaxed">
              Algorithmic graph routing calculating shortest paths, multi-floor transitions, and accessible ramps.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 text-white space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm font-bold">
              03
            </div>
            <h2 className="text-base font-semibold text-white">Visitor Assistance</h2>
            <p className="text-xs text-white/70 leading-relaxed">
              Visitor check-in points, event navigation, parking lot guides, and emergency stations.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 text-center text-xs text-white/60 backdrop-blur-xs border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CampusWayLogo className="w-4 h-4 text-white/80" />
            <span className="font-semibold text-white/90">CampusWay Project</span>
          </div>
          <p>
            College Web Application Project &bull; Next.js + TypeScript + Tailwind CSS &bull; FastAPI Backend
          </p>
        </div>
      </footer>
    </div>
  );
}
