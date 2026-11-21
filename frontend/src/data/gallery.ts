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
  colSpanDesktop: string;
  colSpanTablet: string;
  hasOrangeAccent?: boolean;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  // ROW 1: 5 + 4 + 3 = 12 columns
  {
    id: "g1",
    num: "01",
    title: "Division of Admissions & Central Pavilion",
    location: "LPU Campus • Block 30",
    year: "2018",
    tag: "MONUMENTAL FACADE",
    src: "/images/lpu/plate1-admissions.webp",
    alt: "Modern geometric facade and entrance canopy of Block 30 Division of Admissions at Lovely Professional University",
    w: 1280,
    h: 837,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
  {
    id: "g2",
    num: "02",
    title: "UniMall Lifestyle & Student Commons",
    location: "LPU Central Campus Hub",
    year: "2012",
    tag: "CAMPUS ARTERY",
    src: "/images/lpu/plate2-unimall.webp",
    alt: "Curved multi-story exterior architecture and entrance of UniMall at Lovely Professional University",
    w: 1080,
    h: 1080,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g3",
    num: "03",
    title: "School of Architecture & Design",
    location: "LPU Campus • Block 6",
    year: "2006",
    tag: "DESIGN ATELIER",
    src: "/images/lpu/plate3-architecture.webp",
    alt: "Brick facade and academic pavilion of School of Architecture and Design (Block 6) at LPU",
    w: 621,
    h: 412,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },

  // ROW 2: 3 + 4 + 5 = 12 columns
  {
    id: "g4",
    num: "04",
    title: "Central Academic Pedestrian Spine",
    location: "Central Academic Thoroughfare",
    year: "2010",
    tag: "CIRCULATION AXIS",
    src: "/images/lpu/plate4-pedestrian-spine.webp",
    alt: "Wide perspective looking down the main pedestrian concourse framed by multi-story academic blocks at LPU",
    w: 495,
    h: 619,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },
  {
    id: "g5",
    num: "05",
    title: "Shanti Devi Mittal Auditorium",
    location: "Auditorium Complex",
    year: "2016",
    tag: "PLENARY FORUM",
    src: "/images/lpu/plate5-auditorium.webp",
    alt: "Tiered seating and performance stage of the Shanti Devi Mittal Grand Auditorium at LPU",
    w: 900,
    h: 600,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g6",
    num: "06",
    title: "Sunset Amphitheater & Central Quad",
    location: "LPU Campus • Central Quadrangle",
    year: "2014",
    tag: "CIVIC PLAZA",
    src: "/images/lpu/plate6-amphitheater.webp",
    alt: "Stepped outdoor amphitheater and campus quadrangle bathed in golden sunset light at LPU",
    w: 653,
    h: 470,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
];
