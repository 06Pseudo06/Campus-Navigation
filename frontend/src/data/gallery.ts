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
    title: "Block 35 Academic Core",
    location: "LPU Campus &bull; Engineering Blocks",
    year: "2008",
    tag: "ENGINEERING CORE",
    src: "/images/lpu/plate1-block35.webp",
    alt: "Architectural facade of LPU Block 35 Faculty of Technology and Sciences",
    w: 554,
    h: 554,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
  {
    id: "g2",
    num: "02",
    title: "UniMall Lifestyle & Student Hub",
    location: "Central Campus Artery",
    year: "2012",
    tag: "STUDENT COMMONS",
    src: "/images/lpu/plate2-unimall.webp",
    alt: "Exterior view of LPU UniMall multistory student lifestyle and shopping center",
    w: 1080,
    h: 1080,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g3",
    num: "03",
    title: "Central Quadrangle & Pavilion Dome",
    location: "Central Academic Concourse",
    year: "2010",
    tag: "ARCHITECTURAL DOME",
    src: "/images/lpu/plate3-atrium.webp",
    alt: "Interior and quadrangle architectural pavilion dome at Lovely Professional University",
    w: 495,
    h: 619,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },

  // ROW 2: 3 + 4 + 5 = 12 columns
  {
    id: "g4",
    num: "04",
    title: "Faculty Courtyard & Open Quadrangle",
    location: "Academic Blocks Quad",
    year: "2011",
    tag: "OPEN-AIR QUAD",
    src: "/images/lpu/plate4-openblock.webp",
    alt: "Open-air landscaped quadrangle courtyard between academic blocks at LPU",
    w: 386,
    h: 518,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },
  {
    id: "g5",
    num: "05",
    title: "Campus Dining & Shopping Concourse",
    location: "Student Life Promenade",
    year: "2015",
    tag: "STUDENT CONCOURSE",
    src: "/images/lpu/plate5-dining.webp",
    alt: "LPU student shopping and dining concourse with pedestrian walkway and outdoor seating",
    w: 1600,
    h: 680,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g6",
    num: "06",
    title: "Main Entry Boulevard & Gateway",
    location: "LPU Grand Entry Plaza",
    year: "2005",
    tag: "CAMPUS GATEWAY",
    src: "/images/lpu/plate6-entrance.webp",
    alt: "Monumental entrance boulevard and main gateway of Lovely Professional University",
    w: 1592,
    h: 912,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
];
