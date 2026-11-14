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
      className="relative w-full bg-[#F7F3EC] text-[#111111] py-20 lg:py-28 overflow-hidden select-none border-b border-[#111111]/12 section-gutter"
      aria-label="Campus Architectural Photography Gallery"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#111111]/12">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#111111]">
              <span className="text-[#E8542F]">05 /</span>
              <span>CAMPUS ARCHITECTURAL ATLAS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111]">
              Monuments &amp; Quadrangles
            </h2>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#5B5750] uppercase">
            12 ARCHITECTURAL PLATES &bull; DENSE COMPOSITE
          </span>
        </div>

        {/* 12-Column Masonry Collage Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 lg:auto-rows-[92px]">
          {GALLERY_ITEMS.map((item, idx) => {
            const isCircle = !!item.isCircularCrop;
            const hasAccent = !!item.hasOrangeAccent;

            return (
              <div
                key={item.id}
                className={`relative group ${item.colSpanDesktop} ${item.rowSpanDesktop} min-h-[260px] sm:min-h-[300px] lg:min-h-0`}
              >
                {/* Terracotta Offset Block Behind Selected Tiles */}
                {hasAccent && (
                  <div
                    aria-hidden="true"
                    className="absolute -inset-1.5 sm:-inset-2 bg-[#E8542F] rounded-[24px] -z-10 translate-x-2 translate-y-2 opacity-85 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-300"
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
                  className={`w-full h-full relative overflow-hidden bg-[#111111] border border-[#111111]/15 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer ${
                    isCircle
                      ? "rounded-t-full rounded-b-[20px] sm:rounded-[20px]"
                      : "rounded-[20px]"
                  }`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    unoptimized
                    loading={idx < 4 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                    className="object-cover object-center transition-all duration-700 group-hover:scale-106 filter grayscale-[25%] group-hover:grayscale-0"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-[#111111]/25 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />

                  {/* Corner Plate Stamp */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111111]/70 backdrop-blur-sm border border-white/15 text-[10px] font-mono tracking-widest text-white/90 uppercase">
                    <span className="text-[#E8542F] font-bold">{item.num}</span>
                    <span className="hidden sm:inline text-white/40">/</span>
                    <span className="hidden sm:inline text-white/70">{item.tag}</span>
                  </div>

                  {/* Year Tag Top Right */}
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 text-[10px] font-mono tracking-widest text-white/60 bg-[#111111]/60 px-2 py-0.5 rounded-full border border-white/10">
                    {item.year}
                  </div>

                  {/* Bottom Hover Caption */}
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-col justify-end text-white transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300 z-10">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-white/60 truncate">
                      {item.location}
                    </span>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight text-white group-hover:text-[#E8542F] transition-colors truncate">
                        {item.title}
                      </h3>
                      <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-[#E8542F] text-white flex items-center justify-center text-xs shrink-0 transition-colors">
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
          className="fixed inset-0 z-[200] bg-[#0E1118]/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-fadeIn"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
        >
          <div
            className="relative max-w-5xl w-full bg-[#161922] rounded-[24px] overflow-hidden border border-white/15 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 text-white font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[#E8542F] font-bold tracking-wider">
                  [{selectedItem.num} / 12]
                </span>
                <span className="hidden sm:inline text-white/60 uppercase">
                  {selectedItem.location}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors"
                  aria-label="Previous image"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors"
                  aria-label="Next image"
                >
                  &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#E8542F] flex items-center justify-center text-white text-base font-bold transition-colors ml-2"
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
            <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-[#12141C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
              <div>
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-white/60 font-mono">
                  {selectedItem.location} &bull; {selectedItem.tag}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-[#E8542F] font-bold">
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