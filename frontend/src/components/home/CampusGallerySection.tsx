"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface GalleryItem {
  id: string;
  title: string;
  location: string;
  aspect: string;
  image: string;
  year: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g1",
    title: "Brutalist Concrete Cantilever",
    location: "Dunton Tower Academic Wing",
    aspect: "aspect-[3/4]",
    image: "/images/arch-gallery_1.jpg",
    year: "1972 / 2026",
  },
  {
    id: "g2",
    title: "Curved Concourse Elevation",
    location: "MacOdrum Concourse Quad",
    aspect: "aspect-[4/5]",
    image: "/images/arch-gallery_2.jpg",
    year: "1985 / 2026",
  },
  {
    id: "g3",
    title: "Curtain Glass Mullions & Skylight",
    location: "Richcraft Hall Atrium",
    aspect: "aspect-[16/10]",
    image: "/images/arch-gallery_3.jpg",
    year: "2012 / 2026",
  },
  {
    id: "g4",
    title: "Precast Concrete Facade Grid",
    location: "Mackenzie Engineering Complex",
    aspect: "aspect-[4/5]",
    image: "/images/arch-gallery_4.jpg",
    year: "1968 / 2026",
  },
  {
    id: "g5",
    title: "Pedestrian Concourse & Loggia",
    location: "Paterson Hall North Arcade",
    aspect: "aspect-[3/4]",
    image: "/images/arch-gallery_5.jpg",
    year: "1978 / 2026",
  },
  {
    id: "g6",
    title: "Illuminated Academic Colonnade",
    location: "ARISE Research Center",
    aspect: "aspect-[16/9]",
    image: "/images/arch-discover.jpg",
    year: "2018 / 2026",
  },
];

export function CampusGallerySection() {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    if (selectedImage) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedImage]);

  return (
    <section
      className="relative w-full bg-[#F7F3EC] text-[#111111] py-20 lg:py-28 overflow-hidden select-none border-b border-[#111111]/12"
      aria-label="Campus Architectural Photography Gallery"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#111111]/12">
          <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase text-[#111111]">
            <span className="text-[#E8542F]">05 /</span>
            <span>CAMPUS ARCHITECTURAL ATLAS</span>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#5B5750] uppercase">
            6 MONUMENTAL QUADRANGLE STUDIES
          </span>
        </div>

        {/* 3-Column Staggered Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {GALLERY_ITEMS.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              data-cursor="VIEW"
              className={`group relative rounded-3xl overflow-hidden bg-[#111111] border border-[#111111]/15 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer ${item.aspect} ${
                idx % 2 === 1 ? "sm:translate-y-6 lg:translate-y-10" : ""
              }`}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                unoptimized
                loading={idx < 3 ? "eager" : "lazy"}
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-108 grayscale group-hover:grayscale-0"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/85 via-[#111111]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Hover Caption Card Slide Up */}
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex flex-col justify-end text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-white/60 mb-1">
                  <span>{item.location}</span>
                  <span className="text-[#E8542F] font-bold">{item.year}</span>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white group-hover:text-[#E8542F] transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-sm text-[#E8542F] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                    ↗
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-[#0E1118]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full bg-[#161922] rounded-3xl overflow-hidden border border-white/15 shadow-2xl space-y-4 p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-white font-mono text-xs">
              <span className="text-[#E8542F] uppercase tracking-wider">
                {selectedImage.location}
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
                aria-label="Close lightbox"
              >
                &times;
              </button>
            </div>

            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black">
              <Image
                src={selectedImage.image}
                alt={selectedImage.title}
                fill
                sizes="100vw"
                className="object-contain object-center"
                priority
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-white">
              <h3 className="text-xl font-bold uppercase">{selectedImage.title}</h3>
              <span className="text-xs font-mono text-white/50">{selectedImage.year}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
