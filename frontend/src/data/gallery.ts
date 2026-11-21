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
    title: "Shri Baldev Raj Mittal Auditorium",
    location: "Main Concourse & Foyer Wing",
    year: "2016",
    tag: "MONUMENTAL FACADE",
    src: "/images/arch-gallery_1.jpg",
    alt: "Monumental facade of Shri Baldev Raj Mittal Auditorium at LPU",
    w: 735,
    h: 919,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
  {
    id: "g2",
    num: "02",
    title: "Central Academic Arcade & Library",
    location: "Central Campus Quadrangle",
    year: "2012",
    tag: "CURTAIN GLAZING",
    src: "/images/arch-gallery_2.jpg",
    alt: "Central library and academic arcade elevation in sunlight at LPU",
    w: 735,
    h: 758,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g3",
    num: "03",
    title: "Academic Block 1 & 2 Atrium",
    location: "Fashion & Design Faculty Wing",
    year: "2010",
    tag: "ELEVATION STUDY",
    src: "/images/arch-gallery_3.jpg",
    alt: "Academic Block 1 and 2 entrance pavilion",
    w: 1200,
    h: 627,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },

  // ROW 2: 3 + 4 + 5 = 12 columns
  {
    id: "g4",
    num: "04",
    title: "Covered Pedestrian Colonnade",
    location: "Uni-Mall Weather Concourse",
    year: "2015",
    tag: "ALL-WEATHER AXIS",
    src: "/images/arch-gallery_5.jpg",
    alt: "Covered pedestrian walkway providing all-weather campus connectivity",
    w: 392,
    h: 587,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },
  {
    id: "g5",
    num: "05",
    title: "Gate 1 Grand Entrance Portal",
    location: "Grand Entrance Plaza & Avenue",
    year: "2008",
    tag: "CAMPUS GATEWAY",
    src: "/images/arch-discover.jpg",
    alt: "Illuminated modern academic portal connecting campus wings",
    w: 735,
    h: 980,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g6",
    num: "06",
    title: "Circulation Spine & Quad Portal",
    location: "Central Concourse Artery",
    year: "2014",
    tag: "CIRCULATION AXIS",
    src: "/images/arch-navigate.jpg",
    alt: "Main campus pedestrian circulation artery connecting academic blocks",
    w: 1024,
    h: 1536,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
];
