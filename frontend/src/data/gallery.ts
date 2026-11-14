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
  colSpanDesktop: string; // Tailwind col-span for desktop (sums to 12 per row)
  colSpanTablet: string;  // Tailwind col-span for tablet
  hasOrangeAccent?: boolean;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  // ROW 1: 5 + 4 + 3 = 12 columns
  {
    id: "g1",
    num: "01",
    title: "Brutalist Cantilever Elevation",
    location: "Dunton Tower Academic Wing",
    year: "1972",
    tag: "CONCRETE FORMWORK",
    src: "/images/arch-gallery_1.jpg",
    alt: "Monumental brutalist concrete cantilever facade at Dunton Tower",
    w: 735,
    h: 919,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
  {
    id: "g2",
    num: "02",
    title: "Curved Concourse Arcade",
    location: "MacOdrum Quadrangle Elevation",
    year: "1985",
    tag: "ELEVATION STUDY",
    src: "/images/arch-gallery_2.jpg",
    alt: "Curved architectural concourse elevation in sunlight",
    w: 735,
    h: 758,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g3",
    num: "03",
    title: "Curtain Glass & River Atrium",
    location: "Richcraft Hall River Atrium",
    year: "2012",
    tag: "SOLAR GLAZING",
    src: "/images/arch-gallery_3.jpg",
    alt: "High-performance glass curtain wall reflecting the quad",
    w: 1200,
    h: 627,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },

  // ROW 2: 3 + 4 + 5 = 12 columns
  {
    id: "g4",
    num: "04",
    title: "Covered Pedestrian Loggia",
    location: "Paterson Hall North Arcade",
    year: "1978",
    tag: "WEATHER CONNECTIVITY",
    src: "/images/arch-gallery_5.jpg",
    alt: "Pedestrian concourse colonnade providing all-weather campus connectivity",
    w: 392,
    h: 587,
    colSpanDesktop: "lg:col-span-3",
    colSpanTablet: "sm:col-span-12",
  },
  {
    id: "g5",
    num: "05",
    title: "Illuminated Academic Portal",
    location: "ARISE Advanced Research Complex",
    year: "2018",
    tag: "NIGHT VISUAL AXIS",
    src: "/images/arch-discover.jpg",
    alt: "Illuminated modern academic colonnade walkway connecting academic wings",
    w: 735,
    h: 980,
    colSpanDesktop: "lg:col-span-4",
    colSpanTablet: "sm:col-span-6",
  },
  {
    id: "g6",
    num: "06",
    title: "Circulation Spine & Quad Portal",
    location: "University Centre Main Concourse",
    year: "1970",
    tag: "CIRCULATION AXIS",
    src: "/images/arch-navigate.jpg",
    alt: "Main campus pedestrian circulation artery connecting university quadrangles",
    w: 1024,
    h: 1536,
    colSpanDesktop: "lg:col-span-5",
    colSpanTablet: "sm:col-span-6",
    hasOrangeAccent: true,
  },
];
