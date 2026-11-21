"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "@/lib/motion";
import { GALLERY_ITEMS, GalleryItem } from "@/data/gallery";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CampusGallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
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

  // Genuine Scroll-Driven Progressive Shelf Overlap (Section 4 -> Section 5 Choreography)
  useEffect(() => {
    if (!sectionRef.current || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024;
      gsap.fromTo(
        sectionRef.current,
        {
          y: isDesktop ? 90 : 40,
        },
        {
          y: isDesktop ? -80 : -30,
          ease: "power1.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "top 30%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const renderCard = (
    item: GalleryItem,
    index: number,
    heightClass: string,
    isFeatured: boolean = false
  ) => {
    const hasAccent = !!item.hasOrangeAccent;

    return (
      <div key={item.id} className={`relative group ${heightClass}`}>
        {/* Subtle Terracotta Offset Block Behind Featured Cards */}
        {hasAccent && (
          <div
            aria-hidden="true"
            className="absolute -inset-1 sm:-inset-1.5 bg-[#DE4B31] rounded-[26px] -z-10 translate-x-1.5 translate-y-1.5 sm:translate-x-2 sm:translate-y-2 opacity-85 group-hover:translate-x-2.5 group-hover:translate-y-2.5 transition-transform duration-300"
          />
        )}

        {/* Main Card Surface */}
        <div
          onClick={() => setSelectedIndex(index)}
          data-cursor="EXPAND"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedIndex(index);
            }
          }}
          className="w-full h-full relative overflow-hidden bg-[#0E1118] rounded-[22px] border border-[#0E1118]/12 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col justify-between p-4 sm:p-6"
        >
          {/* Photographic Background */}
          <Image
            src={item.src}
            alt={item.alt}
            fill
            unoptimized
            loading={index < 2 ? "eager" : "lazy"}
            sizes={
              isFeatured
                ? "(max-width: 1024px) 100vw, 720px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
            }
            className="object-cover object-center transition-all duration-700 group-hover:scale-105 filter grayscale-[18%] group-hover:grayscale-0"
          />

          {/* Calibrated Architectural Scrim (Legibility without obscuring photo) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 opacity-70 group-hover:opacity-85 transition-opacity duration-500" />

          {/* Top Category Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 font-mono text-[9px] sm:text-[10px] font-medium tracking-widest uppercase border border-white/15">
              {item.tag}
            </span>
            <span className="text-[10px] font-mono text-white/60 tracking-wider font-semibold">
              PLATE {item.num}
            </span>
          </div>

          {/* Bottom Editorial Caption */}
          <div className="relative z-10 flex flex-col justify-end text-white pt-6">
            {/* Metadata Line */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-wider text-white/70 uppercase mb-1.5">
              <span>{item.location}</span>
              <span className="text-[#DE4B31] font-semibold">ERA {item.year}</span>
            </div>

            {/* Main Location Title with Natural Multi-line Wrapping & Indicator */}
            <div className="flex items-end justify-between gap-3">
              <h3
                className={`font-bold uppercase tracking-tight text-white group-hover:text-[#DE4B31] transition-colors leading-snug ${
                  isFeatured
                    ? "text-base sm:text-xl lg:text-2xl line-clamp-2"
                    : "text-sm sm:text-base lg:text-lg line-clamp-2"
                }`}
              >
                {item.title}
              </h3>

              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 group-hover:bg-[#DE4B31] border border-white/15 group-hover:border-[#DE4B31] text-white text-xs transition-all duration-300 shrink-0">
                ↗
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      id="section-05"
      ref={sectionRef}
      className="relative z-[20] w-full bg-[#F7F3EC] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 rounded-t-[36px] sm:rounded-t-[48px] lg:rounded-t-[56px] border-t border-[#E1DDD3] dark:border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.14)] dark:shadow-[0_-30px_70px_rgba(0,0,0,0.65)] pt-16 sm:pt-20 lg:pt-24 pb-20 lg:pb-28 overflow-hidden select-none border-b border-[#E1DDD3] dark:border-white/10 transition-colors duration-200 will-change-transform"
      style={{ marginBottom: "-80px" }}
      aria-label="Campus Architectural Photography Gallery"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-8 sm:space-y-10">
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E1DDD3] dark:border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-xs font-mono font-semibold tracking-widest uppercase text-[#6B665C] dark:text-zinc-400">
              <span className="text-[#DE4B31] font-bold">05 /</span>
              <span>CAMPUS ARCHITECTURAL ATLAS</span>
              <span className="inline-block w-8 h-px bg-[#DE4B31]/40" aria-hidden="true" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-[#0E1118] dark:text-white leading-[1.05]">
              Monuments &amp; Quadrangles
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-[#6B665C] dark:text-zinc-400 uppercase">
            <span className="hidden sm:inline">SERIES 2026</span>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
            <span>06 ARCHITECTURAL PLATES &bull; LPU CAMPUS</span>
          </div>
        </div>

        {/* Editorial Magazine Asymmetric Layout */}
        <div className="space-y-5 lg:space-y-6">
          {/* Row 1: Featured Anchor (7 Cols) + Stacked Duo (5 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {/* Left: Featured Masterwork (Plate 01 - Block 30 Admissions) */}
            <div className="lg:col-span-7">
              {renderCard(
                GALLERY_ITEMS[0],
                0,
                "h-[340px] sm:h-[420px] lg:h-[516px]",
                true
              )}
            </div>

            {/* Right: Stacked Supporting Duo (Plate 02 & Plate 03) */}
            <div className="lg:col-span-5 flex flex-col gap-5 lg:gap-6 justify-between">
              {renderCard(
                GALLERY_ITEMS[1],
                1,
                "h-[220px] sm:h-[240px] lg:h-[246px]"
              )}
              {renderCard(
                GALLERY_ITEMS[2],
                2,
                "h-[220px] sm:h-[240px] lg:h-[246px]"
              )}
            </div>
          </div>

          {/* Row 2: Harmonic Architectural Trio (Plates 04, 05, 06) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {renderCard(
              GALLERY_ITEMS[3],
              3,
              "h-[260px] sm:h-[300px] lg:h-[340px]"
            )}
            {renderCard(
              GALLERY_ITEMS[4],
              4,
              "h-[260px] sm:h-[300px] lg:h-[340px]"
            )}
            {renderCard(
              GALLERY_ITEMS[5],
              5,
              "h-[260px] sm:h-[300px] lg:h-[340px]"
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal with Next / Prev and Escape */}
      {selectedItem && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200"
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
                <span className="hidden sm:inline text-white/70 uppercase">
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
                  {selectedItem.location} • {selectedItem.tag}
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
