import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "About CampusWay | Campus Navigation & Wayfinding",
  description: "Learn about the CampusWay university wayfinding and navigation project.",
};

export default function AboutPage() {
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
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70" />
      </div>

      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center items-center text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white max-w-2xl shadow-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE4B31]/30 border border-[#DE4B31]/50 text-xs font-semibold text-orange-200">
            <span>About The Project</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            About CampusWay
          </h1>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed font-light text-left">
            <strong>CampusWay</strong> is a comprehensive campus navigation and wayfinding web application built to help university students, freshmen, visiting faculty, and guest attendees effortlessly orient themselves across campus facilities.
          </p>

          <div className="text-left bg-black/30 p-4 rounded-xl border border-white/10 text-xs text-white/80 space-y-2">
            <h2 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Architectural Stack:
            </h2>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Frontend: Next.js (App Router) + TypeScript + Tailwind CSS</li>
              <li>Backend: FastAPI (Python) + Python Graph Routing Algorithms</li>
              <li>Database: PostgreSQL with Docker local environment</li>
              <li>Authentication: JWT sessions, Google OAuth, &amp; Mobile OTP</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/explore"
              className="px-6 py-2.5 rounded-xl bg-[#DE4B31] hover:bg-[#C93F27] text-white text-sm font-semibold tracking-wide transition-all shadow-md"
            >
              Explore Campus Map
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center text-xs text-white/50 backdrop-blur-xs">
        <p>CampusWay Navigation &bull; Academic Wayfinding System</p>
      </footer>
    </div>
  );
}
