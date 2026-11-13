"use client";

import React from "react";
import Link from "next/link";
import { CampusWayLogo } from "@/components/icons/Icons";

export function EditorialFooter() {
  return (
    <footer className="w-full bg-[#FAF8F5] text-[#111111] py-12 lg:py-16 border-t border-[#1A1A1A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="flex items-center gap-2.5 text-[#111111]">
              <div className="w-7 h-7 rounded-lg bg-[#D9532F] text-white flex items-center justify-center">
                <CampusWayLogo className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#111111]">
                CampusWay
              </span>
            </Link>
            <p className="text-xs text-[#5A5854] leading-relaxed max-w-sm">
              An intelligent, university campus navigation and route planning platform designed with
              architectural clarity and sub-2ms graph pathfinding.
            </p>
            <div className="text-[10px] font-mono text-[#88847C] tracking-wider uppercase pt-1">
              DEMONSTRATION QUAD &bull; CARLETON UNIVERSITY
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-mono uppercase tracking-wider">
            <div className="space-y-3">
              <span className="font-bold text-[#111111] block">NAVIGATION</span>
              <ul className="space-y-2 text-[#5A5854]">
                <li>
                  <Link href="/explore" className="hover:text-[#D9532F] transition-colors">
                    Explore Map
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=routes" className="hover:text-[#D9532F] transition-colors">
                    Predefined Routes
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=saved" className="hover:text-[#D9532F] transition-colors">
                    Saved Places
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-[#111111] block">PLATFORM</span>
              <ul className="space-y-2 text-[#5A5854]">
                <li>
                  <Link href="/about" className="hover:text-[#D9532F] transition-colors">
                    About Project
                  </Link>
                </li>
                <li>
                  <Link href="/explore?tab=help" className="hover:text-[#D9532F] transition-colors">
                    Visitor Support
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#D9532F] transition-colors">
                    Sign In / Guest
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <span className="font-bold text-[#111111] block">SPECIFICATION</span>
              <ul className="space-y-2 text-[#88847C] text-[11px]">
                <li>48 Buildings Indexed</li>
                <li>1,957 Graph Nodes</li>
                <li>Dijkstra + A* Solvers</li>
                <li>Zero-Login Storage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1A1A1A]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#88847C]">
          <div>
            &copy; {new Date().getFullYear()} CampusWay Project. College Web Application &bull; Next.js + FastAPI.
          </div>
          <div className="flex items-center gap-4">
            <span>WARM IVORY {"//"} TERRACOTTA ARCHITECTURE</span>
            <span>&bull;</span>
            <Link href="/explore" className="hover:text-[#111111] transition-colors">
              Launch App &rarr;
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
