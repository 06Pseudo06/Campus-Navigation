export interface AtlasPlate {
  id: string;
  num: string;
  category: string;
  title: string;
  eyebrow: string;
  era: string;
  image: string;
  alt: string;
  href: string;
  w: number;
  h: number;
  // Legacy aliases for backward compatibility:
  tag: string;
  location: string;
  year: string;
  src: string;
  hasOrangeAccent?: boolean;
}

export type GalleryItem = AtlasPlate;

export const ATLAS_PLATES: AtlasPlate[] = [
  // 01: FEATURED ANCHOR — Block 30 Division of Admissions
  {
    id: "plate-01",
    num: "01",
    category: "MONUMENTAL FACADE",
    title: "Division of Admissions & Central Pavilion",
    eyebrow: "LPU CAMPUS · BLOCK 30",
    era: "2018",
    image: "/images/lpu/plate1-admissions.webp",
    alt: "Block 30 Division of Admissions architectural facade with geometric canopy and stone walls at Lovely Professional University",
    href: "#plate-01",
    w: 1280,
    h: 837,
    tag: "MONUMENTAL FACADE",
    location: "LPU CAMPUS · BLOCK 30",
    year: "2018",
    src: "/images/lpu/plate1-admissions.webp",
    hasOrangeAccent: true,
  },

  // 02: UniMall Lifestyle & Student Commons
  {
    id: "plate-02",
    num: "02",
    category: "STUDENT COMMONS",
    title: "UniMall Lifestyle & Student Commons",
    eyebrow: "LPU CAMPUS · CENTRAL ARTERY",
    era: "2012",
    image: "/images/lpu/plate2-unimall.webp",
    alt: "Curved multi-story exterior architecture and entrance of UniMall at Lovely Professional University",
    href: "#plate-02",
    w: 1080,
    h: 1080,
    tag: "STUDENT COMMONS",
    location: "LPU CAMPUS · CENTRAL ARTERY",
    year: "2012",
    src: "/images/lpu/plate2-unimall.webp",
  },

  // 03: Panoramic Campus Skyline & Boulevard
  {
    id: "plate-03",
    num: "03",
    category: "CAMPUS VISTA",
    title: "Panoramic Campus Skyline & Boulevard",
    eyebrow: "LPU CAMPUS · GRAND VISTA",
    era: "2005",
    image: "/images/lpu/plate3-skyline.webp",
    alt: "Grand aerial panoramic view of Lovely Professional University academic blocks and landscaped boulevards",
    href: "#plate-03",
    w: 1600,
    h: 900,
    tag: "CAMPUS VISTA",
    location: "LPU CAMPUS · GRAND VISTA",
    year: "2005",
    src: "/images/lpu/plate3-skyline.webp",
  },

  // 04: Central Academic Pedestrian Spine
  {
    id: "plate-04",
    num: "04",
    category: "CIRCULATION AXIS",
    title: "Central Academic Pedestrian Spine",
    eyebrow: "LPU CAMPUS · THOROUGHFARE",
    era: "2010",
    image: "/images/lpu/plate4-pedestrian-spine.webp",
    alt: "High-angle perspective along the central pedestrian thoroughfare flanked by multi-story academic buildings at LPU",
    href: "#plate-04",
    w: 495,
    h: 619,
    tag: "CIRCULATION AXIS",
    location: "LPU CAMPUS · THOROUGHFARE",
    year: "2010",
    src: "/images/lpu/plate4-pedestrian-spine.webp",
  },

  // 05: Shanti Devi Mittal Grand Auditorium
  {
    id: "plate-05",
    num: "05",
    category: "PLENARY FORUM",
    title: "Shanti Devi Mittal Grand Auditorium",
    eyebrow: "LPU CAMPUS · PLENARY COMPLEX",
    era: "2016",
    image: "/images/lpu/plate5-auditorium.webp",
    alt: "Tiered seating and performance stage of the Shanti Devi Mittal Grand Auditorium at Lovely Professional University",
    href: "#plate-05",
    w: 900,
    h: 600,
    tag: "PLENARY FORUM",
    location: "LPU CAMPUS · PLENARY COMPLEX",
    year: "2016",
    src: "/images/lpu/plate5-auditorium.webp",
  },

  // 06: Sunset Amphitheater & Academic Quad
  {
    id: "plate-06",
    num: "06",
    category: "CIVIC PLAZA",
    title: "Sunset Amphitheater & Academic Quad",
    eyebrow: "LPU CAMPUS · CENTRAL QUAD",
    era: "2014",
    image: "/images/lpu/plate6-amphitheater.webp",
    alt: "Stepped outdoor amphitheater and campus quadrangle bathed in golden sunset light at Lovely Professional University",
    href: "#plate-06",
    w: 653,
    h: 470,
    tag: "CIVIC PLAZA",
    location: "LPU CAMPUS · CENTRAL QUAD",
    year: "2014",
    src: "/images/lpu/plate6-amphitheater.webp",
    hasOrangeAccent: true,
  },
];

// Legacy export alias for backward compatibility
export const GALLERY_ITEMS: AtlasPlate[] = ATLAS_PLATES;
