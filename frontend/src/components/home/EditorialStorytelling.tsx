"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function FeatureColumn({
  number,
  title,
  description,
  href,
  icon,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:bg-white/60 cursor-pointer border-b sm:border-b-0 sm:border-r border-[#151515]/10 last:border-r-0"
    >
      <div className="space-y-4">
        {/* Top: Icon + Number */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 flex items-center justify-center text-[#E6532E] transition-transform group-hover:scale-110">
            {icon}
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#8B8780] uppercase group-hover:text-[#E6532E] transition-colors">
            {number}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#151515] group-hover:text-[#E6532E] transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#5A5854] font-normal leading-relaxed">
          {description}
        </p>
      </div>

      {/* Bottom Link Arrow */}
      <div className="pt-6 sm:pt-8 flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#151515] group-hover:text-[#E6532E] transition-colors">
        <span>LEARN MORE</span>
        <span className="text-base text-[#E6532E] font-bold transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
          ↗
        </span>
      </div>
    </Link>
  );
}

export function EditorialStorytelling() {
  return (
    <section
      id="features"
      className="relative w-full bg-[#F7F3ED] text-[#151515] py-16 sm:py-24 border-b border-[#151515]/10 overflow-hidden"
      aria-label="What You Can Do"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
        {/* Section Header: 02 / WHAT YOU CAN DO */}
        <div className="flex items-center justify-between pb-4 border-b border-[#151515]/10">
          <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#151515]">
            <span className="text-[#E6532E]">02 /</span>
            <span>WHAT YOU CAN DO</span>
          </div>
          <span className="hidden sm:inline text-[11px] font-mono text-[#8B8780] tracking-wider uppercase">
            ESSENTIAL CAMPUSWAY CAPABILITIES
          </span>
        </div>

        {/* 3-Card Editorial Row Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-[#FAF6F0] border border-[#151515]/10 overflow-hidden shadow-sm">
          {/* Far Left: Concrete Arch Visual Thumbnail */}
          <div className="hidden lg:flex md:col-span-3 relative bg-[#151515] overflow-hidden items-center justify-center p-4 border-r border-[#151515]/10">
            <Image
              src="/images/section02-arch-thumb.png"
              alt="Architectural concrete colonnade detail"
              width={240}
              height={140}
              className="w-full h-full object-cover grayscale opacity-75 hover:opacity-100 hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515]/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-[10px] font-mono tracking-widest uppercase text-white/80">
                QUAD_STUDY {"//"} 02
              </span>
            </div>
          </div>

          {/* 3 Feature Columns (Discover, Navigate, Save) */}
          <div className="md:col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-3">
            {/* 1. Discover */}
            <FeatureColumn
              number="01"
              title="Discover"
              description="Find buildings, departments and key facilities across campus."
              href="/explore"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              }
            />

            {/* 2. Navigate */}
            <FeatureColumn
              number="02"
              title="Navigate"
              description="Get the shortest, accessible walking routes in real time."
              href="/explore?tab=routes"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />

            {/* 3. Save */}
            <FeatureColumn
              number="03"
              title="Save"
              description="Keep your frequent destinations handy for quick access."
              href="/explore?tab=saved"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
