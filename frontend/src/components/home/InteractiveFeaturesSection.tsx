"use client";

import React from "react";
import Link from "next/link";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureCard[] = [
  {
    id: "discover",
    title: "Discover",
    description: "Find buildings, departments and key facilities across campus.",
    href: "/explore",
    icon: (
      <svg
        className="w-8 h-8 text-[#E8542F] transition-transform duration-300 group-hover:scale-110"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        {/* Architectural Folded Map / Book Icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
  },
  {
    id: "navigate",
    title: "Navigate",
    description: "Get the shortest, accessible walking routes in real time.",
    href: "/explore?tab=routes",
    icon: (
      <svg
        className="w-8 h-8 text-[#E8542F] transition-transform duration-300 group-hover:scale-110"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        {/* Connected Route Nodes / Graph Pathfinder Icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
        <circle cx="5" cy="19" r="2" fill="#E8542F" />
        <circle cx="9" cy="15" r="2" fill="#E8542F" />
        <circle cx="13" cy="19" r="2" fill="#E8542F" />
        <circle cx="21" cy="7" r="2" fill="#E8542F" />
      </svg>
    ),
  },
  {
    id: "save",
    title: "Save",
    description: "Keep your frequent destinations handy for quick access.",
    href: "/explore?tab=saved",
    icon: (
      <svg
        className="w-8 h-8 text-[#E8542F] transition-transform duration-300 group-hover:scale-110"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        {/* Bookmark Ribbon Icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    ),
  },
];

export function InteractiveFeaturesSection() {
  return (
    <section
      id="features"
      className="relative w-full bg-[#F7F3EC] text-[#111111] py-16 sm:py-24 border-b border-[#111111]/12 select-none overflow-hidden"
      aria-label="What You Can Do"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header: 02 / WHAT YOU CAN DO */}
        <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#111111] mb-12 sm:mb-16">
          <span className="text-[#E8542F]">02 /</span>
          <span>WHAT YOU CAN DO</span>
        </div>

        {/* Clean 3-Card Editorial Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#111111]/12 border-y md:border border-[#111111]/12 bg-[#F7F3EC]">
          {FEATURES.map((feature, idx) => (
            <Link
              key={feature.id}
              href={feature.href}
              data-cursor="EXPLORE"
              className="group relative p-8 sm:p-10 lg:p-12 flex flex-col justify-between hover:bg-[#F2ECE1]/60 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8542F]"
            >
              {/* Corner Accent on Hover */}
              <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-[#E8542F]/10 transform rotate-45 translate-x-8 -translate-y-8" />
              </div>

              {/* Icon & Title */}
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-[#E8542F]/10 border border-[#E8542F]/20 flex items-center justify-center transition-colors group-hover:bg-[#E8542F]/15">
                  {feature.icon}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider">
                      0{idx + 1}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111] group-hover:text-[#E8542F] transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-[#5B5750] font-normal leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Bottom Arrow Link */}
              <div className="pt-8 flex items-center gap-2 text-sm font-mono font-bold text-[#111111] group-hover:text-[#E8542F] transition-colors">
                <span className="text-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                  ↗
                </span>
                <span className="text-[11px] uppercase tracking-widest text-[#5B5750] group-hover:text-[#E8542F]">
                  EXPLORE {feature.title.toUpperCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
