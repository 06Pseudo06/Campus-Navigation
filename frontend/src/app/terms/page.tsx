"use client";

import React from "react";
import Link from "next/link";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { EditorialFooter } from "@/components/home/EditorialFooter";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#111111] selection:bg-[#E8542F] selection:text-white flex flex-col font-sans">
      <EditorialNavbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
        {/* Header Block */}
        <div className="space-y-4 border-b border-[#111111]/12 pb-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
            <span className="text-[#E8542F]">LEGAL TERMS</span>
            <span>&bull;</span>
            <span>TERMS OF SERVICE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#111111] font-display">
            Terms of <span className="italic text-[#E8542F]">Service</span>
          </h1>

          <p className="text-base sm:text-lg text-[#5B5750] max-w-2xl font-sans leading-relaxed">
            By utilizing the CampusWay wayfinding platform, you agree to these clear guidelines regarding navigational accuracy, academic demonstration usage, and system boundaries.
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Quick Table of Contents Sticky Column */}
          <aside className="md:col-span-4 space-y-4">
            <div className="sticky top-28 p-5 rounded-2xl bg-white border border-[#E1DDD3] shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Quick Navigation
              </span>
              <nav className="flex flex-col space-y-2 text-xs font-mono text-[#5B5750]">
                <a href="#acceptable-use" className="hover:text-[#E8542F] transition-colors">
                  01. Acceptable Use
                </a>
                <a href="#nav-accuracy" className="hover:text-[#E8542F] transition-colors">
                  02. Navigational Accuracy
                </a>
                <a href="#accessibility" className="hover:text-[#E8542F] transition-colors">
                  03. Step-Free Routing
                </a>
                <a href="#intellectual-prop" className="hover:text-[#E8542F] transition-colors">
                  04. Intellectual Property
                </a>
                <a href="#disclaimers" className="hover:text-[#E8542F] transition-colors">
                  05. Disclaimers &amp; Liability
                </a>
              </nav>
            </div>
          </aside>

          {/* Legal Prose Content */}
          <article className="md:col-span-8 space-y-10 text-sm leading-relaxed text-[#2B2925] font-sans">
            <section id="acceptable-use" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  01. Acceptable Use
                </span>
              </div>
              <p>
                CampusWay is provided for university students, faculty, staff, and visitors for educational, spatial orientation, and pedestrian navigation purposes. Automated scraping, systematic extraction of campus spatial graphs without attribution, or denial-of-service attempts are strictly prohibited.
              </p>
            </section>

            <section id="nav-accuracy" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  02. Navigational Guidance &amp; Campus Conditions
                </span>
              </div>
              <p>
                While CampusWay applies deterministic graph algorithms (Dijkstra and A* pathfinding) across real campus datasets, actual pedestrian conditions may vary due to temporary construction, seasonal weather, maintenance closures, or university security lockdowns. Always prioritize posted physical campus signage and campus safety personnel.
              </p>
            </section>

            <section id="accessibility" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  03. Step-Free &amp; Accessible Corridors
                </span>
              </div>
              <p>
                Our accessible route solver excludes stairs and steep grade segments where designated in the underlying dataset. We continually audit barrier-free connectors; however, elevator maintenance schedules or temporary obstructions may affect barrier-free paths in real time.
              </p>
            </section>

            <section id="intellectual-prop" className="space-y-3 scroll-mt-28">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  04. Intellectual Property &amp; Open Source
                </span>
              </div>
              <p>
                The CampusWay codebase, visual identity, and proprietary styling tokens are developed by Kalyani Mahajan and contributors. Underlying geographic features are provided by OpenStreetMap contributors. See our <Link href="/about" className="text-[#E8542F] font-bold underline">Architecture &amp; Credits page</Link> for complete open-source attribution.
              </p>
            </section>

            <section id="disclaimers" className="space-y-3 scroll-mt-28 border-t border-[#111111]/10 pt-6">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E8542F]">
                <span>✦</span>
                <span className="uppercase tracking-widest text-[#111111]">
                  05. Disclaimers &amp; Limitation of Liability
                </span>
              </div>
              <p>
                The software is provided &ldquo;as is&rdquo;, without warranty of any kind, express or implied. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from navigation delays or routing discrepancies.
              </p>
            </section>
          </article>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

