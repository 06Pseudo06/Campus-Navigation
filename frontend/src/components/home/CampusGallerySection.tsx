"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { GALLERY_ITEMS, GalleryItem } from "@/data/gallery";

export function CampusGallerySection() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedItem: GalleryItem | null =
    selectedIndex !== null ? GALLERY_ITEMS[selectedIndex] : null;

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length
    );
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev + 1) % GALLERY_ITEMS.length
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    if (selectedIndex !== null) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, handlePrev, handleNext]);

  return (
    <section
      id="section-05"
      className="relative z-[10] w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 -mt-16 sm:-mt-20 lg:-mt-28 rounded-t-[32px] sm:rounded-t-[48px] lg:rounded-t-[56px] border-t border-[#E1DDD3] dark:border-white/10 shadow-[0_-24px_48px_rgba(0,0,0,0.06)] dark:shadow-[0_-24px_48px_rgba(0,0,0,0.45)] pt-16 sm:pt-20 lg:pt-24 pb-20 lg:pb-28 overflow-hidden select-none border-b border-[#E1DDD3] dark:border-white/10 transition-colors duration-200"
      aria-label="Campus Architectural Photography Gallery"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E1DDD3] dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#0E1118] dark:text-zinc-200">
              <span className="text-[#DE4B31]">05 /</span>
              <span>CAMPUS ARCHITECTURAL ATLAS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white">
              Monuments &amp; Quadrangles
            </h2>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#6B665C] dark:text-zinc-400 uppercase">
            06 ARCHITECTURAL PLATES &bull; LPU CAMPUS
          </span>
        </div>

        {/* Justified 12-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 lg:gap-6">
          {GALLERY_ITEMS.map((item, idx) => {
            const hasAccent = !!item.hasOrangeAccent;

            return (
              <div
                key={item.id}
                className={`relative group ${item.colSpanTablet} ${item.colSpanDesktop} h-[280px] sm:h-[340px] lg:h-[380px]`}
              >
                {/* Terracotta Offset Block Behind Selected Tiles */}
                {hasAccent && (
                  <div
                    aria-hidden="true"
                    className="absolute -inset-1.5 sm:-inset-2 bg-[#DE4B31] rounded-[24px] -z-10 translate-x-2 translate-y-2 opacity-85 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-300"
                  />
                )}

                {/* Main Card Surface */}
                <div
                  onClick={() => setSelectedIndex(idx)}
                  data-cursor="EXPAND"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedIndex(idx);
                    }
                  }}
                  className="w-full h-full relative overflow-hidden bg-[#0E1118] rounded-[20px] border border-[#0E1118]/15 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    unoptimized
                    loading={idx < 3 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                    className="object-cover object-center transition-all duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold tracking-wider uppercase border border-white/10">
                      {item.tag}
                    </span>
                  </div>

                  {/* Bottom Hover Caption */}
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-col justify-end text-white z-10">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-white/70 truncate">
                      {item.location}
                    </span>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight text-white group-hover:text-[#DE4B31] transition-colors truncate">
                        {item.title}
                      </h3>
                      <div className="w-6 h-6 rounded-full bg-white/15 group-hover:bg-[#DE4B31] text-white flex items-center justify-center text-xs shrink-0 transition-colors">
                        ↗
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal with Next / Prev and Escape */}
      {selectedItem && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
        >
          <div
            className="relative max-w-4xl w-full bg-[#121620] rounded-[24px] overflow-hidden border border-white/15 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 text-white font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[#DE4B31] font-bold tracking-wider">
                  [{selectedItem.num} / 06]
                </span>
                <span className="hidden sm:inline text-white/60 uppercase">
                  {selectedItem.location}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
                  aria-label="Previous image"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
                  aria-label="Next image"
                >
                  &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#DE4B31] flex items-center justify-center text-white text-base font-bold transition-colors ml-2 cursor-pointer"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="relative flex-1 min-h-[300px] sm:min-h-[460px] bg-black flex items-center justify-center overflow-hidden">
              <Image
                src={selectedItem.src}
                alt={selectedItem.alt}
                fill
                unoptimized
                sizes="95vw"
                className="object-contain object-center"
                priority
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-[#0A0D14] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
              <div>
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-white/60 font-mono">
                  {selectedItem.location} &bull; {selectedItem.tag}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-[#DE4B31] font-bold">
                  ERA {selectedItem.year}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
