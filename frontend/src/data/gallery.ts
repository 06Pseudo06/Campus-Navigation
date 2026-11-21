export interface GalleryItem {
  id: string;
  num: string;
  title: string;
  location: string;
  year: string;
  tag: string;
  src: string;
  alt: string;
  w: number;
  h: number;
  hasOrangeAccent?: boolean;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  // 01: FEATURED ANCHOR — Block 30 Division of Admissions
  {
    id: "g1",
    num: "01",
    title: "Division of Admissions & Central Pavilion",
    location: "LPU Campus • Block 30",
    year: "2018",
    tag: "MONUMENTAL FACADE",
    src: "/images/lpu/plate1-admissions.webp",
    alt: "Block 30 Division of Admissions architectural facade with geometric canopy and stone walls at Lovely Professional University",
    w: 1280,
    h: 837,
    hasOrangeAccent: true,
  },

  // 02: UniMall Lifestyle & Student Commons
  {
    id: "g2",
    num: "02",
    title: "UniMall Lifestyle & Student Commons",
    location: "Central Commercial Artery",
    year: "2012",
    tag: "STUDENT COMMONS",
    src: "/images/lpu/plate2-unimall.webp",
    alt: "Curved multi-story exterior architecture and entrance of UniMall at Lovely Professional University",
    w: 1080,
    h: 1080,
  },

  // 03: Panoramic Campus Skyline & Boulevard
  {
    id: "g3",
    num: "03",
    title: "Panoramic Campus Skyline & Boulevard",
    location: "University Grand Vista",
    year: "2005",
    tag: "CAMPUS VISTA",
    src: "/images/lpu/plate3-skyline.webp",
    alt: "Grand aerial panoramic view of Lovely Professional University academic blocks and landscaped boulevards",
    w: 1600,
    h: 900,
  },

  // 04: Central Academic Pedestrian Spine
  {
    id: "g4",
    num: "04",
    title: "Central Academic Pedestrian Spine",
    location: "Academic Thoroughfare",
    year: "2010",
    tag: "CIRCULATION AXIS",
    src: "/images/lpu/plate4-pedestrian-spine.webp",
    alt: "High-angle perspective along the central pedestrian thoroughfare flanked by multi-story academic buildings at LPU",
    w: 495,
    h: 619,
  },

  // 05: Shanti Devi Mittal Grand Auditorium
  {
    id: "g5",
    num: "05",
    title: "Shanti Devi Mittal Grand Auditorium",
    location: "Central Plenary Complex",
    year: "2016",
    tag: "PLENARY FORUM",
    src: "/images/lpu/plate5-auditorium.webp",
    alt: "Tiered seating and performance stage of the Shanti Devi Mittal Grand Auditorium at Lovely Professional University",
    w: 900,
    h: 600,
  },

  // 06: Sunset Amphitheater & Academic Quad
  {
    id: "g6",
    num: "06",
    title: "Sunset Amphitheater & Academic Quad",
    location: "Central Campus Quadrangle",
    year: "2014",
    tag: "CIVIC PLAZA",
    src: "/images/lpu/plate6-amphitheater.webp",
    alt: "Stepped outdoor amphitheater and campus quadrangle bathed in golden sunset light at Lovely Professional University",
    w: 653,
    h: 470,
    hasOrangeAccent: true,
  },
];
