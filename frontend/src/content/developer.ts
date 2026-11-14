export interface DeveloperProfile {
  name: string;
  role: string;
  bio: string;
  photo?: string;
  monogram: string;
  links: {
    github?: string;
    linkedin?: string;
    email?: string;
    portfolio?: string;
  };
  builtWith: string[];
}

export const DEVELOPER_PROFILE: DeveloperProfile = {
  name: "Kalyani Mahajan",
  role: "Lead Full-Stack Engineer & System Architect",
  bio: "Software developer and spatial systems builder focused on high-performance web applications, graph theory, and architectural user interfaces.",
  monogram: "KM",
  links: {
    github: "https://github.com/06Pseudo06",
    linkedin: "https://linkedin.com/in/kalyani-mahajan",
    email: "kalyani.p.mahajan@gmail.com",
  },
  builtWith: [
    "Next.js 14 (App Router)",
    "TypeScript",
    "Tailwind CSS",
    "FastAPI",
    "Python 3.12",
    "Dijkstra & A* Heuristics",
    "PostgreSQL",
    "GSAP & Lenis",
  ],
};

