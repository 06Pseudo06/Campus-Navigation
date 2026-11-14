"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EditorialNavbar } from "@/components/home/EditorialNavbar";
import { EditorialFooter } from "@/components/home/EditorialFooter";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { HairlineDivider } from "@/components/motion/HairlineDivider";
import { DEVELOPER_PROFILE } from "@/content/developer";
import { isReducedMotion } from "@/lib/motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const flowSvgRef = useRef<SVGSVGElement>(null);

  // Counters for key numbers
  const [bldgCount, setBldgCount] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  useEffect(() => {
    if (isReducedMotion()) {
      setBldgCount(48);
      setNodeCount(1957);
      setEdgeCount(124);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setBldgCount(Math.round(48 * ease));
      setNodeCount(Math.round(1957 * ease));
      setEdgeCount(Math.round(124 * ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  // SVG Flow Diagram self-drawing stroke animation on scroll
  useEffect(() => {
    if (!flowSvgRef.current || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      const paths = flowSvgRef.current?.querySelectorAll(".flow-draw-path");
      if (paths && paths.length > 0) {
        paths.forEach((path) => {
          const length = (path as SVGPathElement).getTotalLength();
          gsap.set(path, {
            strokeDasharray: length,
            strokeDashoffset: length,
          });
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: flowSvgRef.current,
              start: "top 75%",
              invalidateOnRefresh: true,
            },
          });
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#F7F3EC] text-[#111111] overflow-x-hidden selection:bg-[#E8542F] selection:text-white"
    >
      <CustomCursor />

      {/* Shared Editorial Navbar */}
      <EditorialNavbar />

      {/* SECTION 1: HERO */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Headline & Overview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
              <span className="text-[#E8542F]">&mdash;</span>
              <span>ABOUT / THE PROJECT</span>
              <span className="w-12 h-px bg-[#111111]/15 inline-block" />
            </div>

            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black uppercase tracking-tight text-[#111111] leading-[0.95] font-display">
              Built to help you{" "}
              <span className="font-display font-black italic text-[#E8542F]">
                arrive.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#5B5750] font-sans leading-relaxed max-w-2xl">
              CampusWay is a campus navigation and wayfinding web app that helps students,
              visiting faculty and guests find buildings and plan accessible walking routes.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/explore"
                className="px-6 py-3.5 rounded-full bg-[#111111] hover:bg-[#E8542F] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-xl hover:scale-102 active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <span>EXPLORE CAMPUS</span>
                <span className="text-[#E8542F] group-hover:text-white font-bold">&rarr;</span>
              </Link>

              <Link
                href="/explore?tab=routes"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-[#F2EFE9] text-[#111111] border border-[#111111]/15 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
              >
                VIEW ROUTES
              </Link>
            </div>
          </div>

          {/* Right Column: Architectural Photography with Sun Disc */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Sun Disc */}
            <div
              className="absolute -top-6 -right-6 w-44 h-44 rounded-full bg-gradient-to-br from-[#F2793A] to-[#E8542F] opacity-90 shadow-xl pointer-events-none -z-0"
              aria-hidden="true"
            >
              <div className="absolute -inset-3 rounded-full border border-[#E8542F]/30" />
            </div>

            {/* Photo Card with ✦ markers */}
            <div className="relative w-full max-w-md aspect-4/3 rounded-[24px] overflow-hidden border border-[#111111]/15 shadow-2xl z-10 bg-[#0E1118]">
              <Image
                src="/images/01_graph_solver.png"
                alt="Architectural perspective of modern university facilities"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white font-mono text-[10px]">
                <span>CAMPUSWAY ATLAS &bull; CARLETON</span>
                <span className="text-[#E8542F] font-bold">✦ VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: KEY NUMBERS */}
      <section className="py-12 bg-white border-y border-[#111111]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider block">
              BUILDINGS INDEXED
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#111111] tabular-nums font-sans">
              {bldgCount}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider block">
              GRAPH NODES
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#111111] tabular-nums font-sans">
              {nodeCount.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider block">
              SURVEYED EDGES
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#111111] tabular-nums font-sans">
              {edgeCount}+
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider block">
              ROUTING LATENCY
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#E8542F] tabular-nums font-sans">
              &lt; 2 ms
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW ROUTING WORKS */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
            <span className="text-[#E8542F]">02 /</span>
            <span>HOW ROUTING WORKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] font-display">
            Mathematical Precision, Real Walking Guidance
          </h2>
        </div>

        {/* SVG Flow Diagram that draws itself */}
        <div className="p-6 sm:p-10 rounded-[24px] bg-[#0F141F] text-white border border-white/10 shadow-xl overflow-hidden relative">
          <div className="absolute top-4 right-4 text-[10px] font-mono text-[#B4BCCB]">
            DATA FLOW PIPELINE &bull; ASYNC GRAPH ENGINE
          </div>

          <svg
            ref={flowSvgRef}
            viewBox="0 0 900 160"
            className="w-full h-auto min-h-[120px] max-w-4xl mx-auto"
          >
            {/* Step 1: Browser */}
            <g transform="translate(60, 40)">
              <rect x="0" y="0" width="140" height="70" rx="12" fill="#151B28" stroke="#E8542F" strokeWidth="1.5" />
              <text x="70" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">Browser UI</text>
              <text x="70" y="50" textAnchor="middle" fill="#B4BCCB" fontSize="9" fontFamily="var(--font-mono)">Next.js 14 App</text>
            </g>

            {/* Path 1 -> 2 */}
            <path d="M 200 75 L 280 75" fill="none" stroke="#E8542F" strokeWidth="2.5" className="flow-draw-path" strokeLinecap="round" />
            <polygon points="280,75 272,70 272,80" fill="#E8542F" />

            {/* Step 2: FastAPI */}
            <g transform="translate(285, 40)">
              <rect x="0" y="0" width="140" height="70" rx="12" fill="#151B28" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <text x="70" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">API Gateway</text>
              <text x="70" y="50" textAnchor="middle" fill="#B4BCCB" fontSize="9" fontFamily="var(--font-mono)">FastAPI (Python)</text>
            </g>

            {/* Path 2 -> 3 */}
            <path d="M 425 75 L 505 75" fill="none" stroke="#E8542F" strokeWidth="2.5" className="flow-draw-path" strokeLinecap="round" />
            <polygon points="505,75 497,70 497,80" fill="#E8542F" />

            {/* Step 3: Solver */}
            <g transform="translate(510, 40)">
              <rect x="0" y="0" width="150" height="70" rx="12" fill="#151B28" stroke="#0F6E73" strokeWidth="1.5" />
              <text x="75" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">Graph Engine</text>
              <text x="75" y="50" textAnchor="middle" fill="#8FE3D6" fontSize="9" fontFamily="var(--font-mono)">Dijkstra / A* Solvers</text>
            </g>

            {/* Path 3 -> 4 */}
            <path d="M 660 75 L 735 75" fill="none" stroke="#E8542F" strokeWidth="2.5" className="flow-draw-path" strokeLinecap="round" />
            <polygon points="735,75 727,70 727,80" fill="#E8542F" />

            {/* Step 4: Storage */}
            <g transform="translate(740, 40)">
              <rect x="0" y="0" width="130" height="70" rx="12" fill="#151B28" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <text x="65" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">Topology Store</text>
              <text x="65" y="50" textAnchor="middle" fill="#B4BCCB" fontSize="9" fontFamily="var(--font-mono)">Postgres / Fallback</text>
            </g>
          </svg>

          {/* 4 Captions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/10 text-xs text-[#B4BCCB]">
            <div>
              <span className="text-[#E8542F] font-mono font-bold block mb-1">01 / OSM WALKWAYS</span>
              <p>Real-world footpaths from OpenStreetMap establish the base topological pedestrian mesh.</p>
            </div>
            <div>
              <span className="text-[#E8542F] font-mono font-bold block mb-1">02 / INFERRED CONNECTORS</span>
              <p>Geometric synthetic links bridge building entrances to paths pending field surveys.</p>
            </div>
            <div>
              <span className="text-[#E8542F] font-mono font-bold block mb-1">03 / DUAL SOLVERS</span>
              <p>Dijkstra ensures strict global optimality, while A* applies Haversine heuristics for speed.</p>
            </div>
            <div>
              <span className="text-[#E8542F] font-mono font-bold block mb-1">04 / STEP-FREE ACCESS</span>
              <p>Stairs and steep slopes are filtered out dynamically when accessible mode is toggled.</p>
            </div>
          </div>
        </div>

        {/* Two-Column Dijkstra vs A* Explainer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-[20px] bg-white border border-[#E1DDD3] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold uppercase tracking-tight text-[#0E1118]">
                Dijkstra&apos;s Algorithm
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#E8542F]/10 text-[#E8542F] text-[10px] font-mono font-bold uppercase">
                GUARANTEED OPTIMAL
              </span>
            </div>
            <p className="text-xs text-[#5B5750] leading-relaxed">
              Explores nodes uniformly in concentric waves based on cumulative edge distance. While slightly more computationally demanding over large graphs, it mathematically guarantees the absolute shortest route across complex pedestrian grids.
            </p>
          </div>

          <div className="p-6 rounded-[20px] bg-white border border-[#E1DDD3] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold uppercase tracking-tight text-[#0E1118]">
                A* Search Algorithm
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                HEURISTIC ACCELERATED
              </span>
            </div>
            <p className="text-xs text-[#5B5750] leading-relaxed">
              Combines path distance with an admissible Haversine great-circle distance heuristic pointing toward the destination node. It prunes non-promising branches, calculating routes in under 1.2 milliseconds.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: ARCHITECTURE STACK */}
      <section className="py-20 bg-[#F2F0EB] border-t border-[#111111]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
              <span className="text-[#E8542F]">03 /</span>
              <span>ENGINEERING STACK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] font-display">
              Production Architecture
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { code: "NX", name: "Next.js 14", role: "App Router, Server Components & React" },
              { code: "TS", name: "TypeScript", role: "Strict Static Type Contracts & Models" },
              { code: "TW", name: "Tailwind CSS", role: "Design Token Architecture & Theming" },
              { code: "FA", name: "FastAPI", role: "Asynchronous Python ASGI Microservice" },
              { code: "PY", name: "Python Graph", role: "Dijkstra & A* Network Solvers" },
              { code: "PG", name: "PostgreSQL", role: "ACID Relational Spatial Database" },
              { code: "JW", name: "JWT & Sessions", role: "Argon2id & Stateful Session Security" },
              { code: "GO", name: "Google OAuth", role: "OpenID Connect Federated Sign-In" },
              { code: "OT", name: "Mobile OTP", role: "6-Digit SMS Verification & Dev Fallback" },
              { code: "GS", name: "GSAP & Lenis", role: "ScrollTrigger Timelines & Smooth Inertia" },
            ].map((st, i) => (
              <div
                key={i}
                className="p-4 rounded-[16px] bg-white border border-[#E1DDD3] hover:border-[#E8542F] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0E1118] text-[#F4F1EA] group-hover:bg-[#E8542F] transition-colors flex items-center justify-center font-mono font-bold text-xs">
                  {st.code}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0E1118] font-sans">{st.name}</h4>
                  <p className="text-[10px] text-[#5B5750] leading-snug mt-0.5">{st.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURES */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
            <span className="text-[#E8542F]">04 /</span>
            <span>CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] font-display">
            Core Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-[20px] bg-white border border-[#E1DDD3] space-y-3 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-[#E8542F]/10 text-[#E8542F] flex items-center justify-center font-bold text-sm">
              01
            </span>
            <h3 className="text-lg font-bold text-[#0E1118]">Discover</h3>
            <p className="text-xs text-[#5B5750] leading-relaxed">
              Find buildings, departments, academic libraries, lecture halls, and visitor facilities across campus with instant fuzzy search and alias matching.
            </p>
          </div>

          <div className="p-6 rounded-[20px] bg-white border border-[#E1DDD3] space-y-3 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-[#E8542F]/10 text-[#E8542F] flex items-center justify-center font-bold text-sm">
              02
            </span>
            <h3 className="text-lg font-bold text-[#0E1118]">Navigate</h3>
            <p className="text-xs text-[#5B5750] leading-relaxed">
              Calculate turn-by-turn walking routes with distance and estimated minutes. Filter for step-free accessible pathways free of staircases.
            </p>
          </div>

          <div className="p-6 rounded-[20px] bg-white border border-[#E1DDD3] space-y-3 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-[#E8542F]/10 text-[#E8542F] flex items-center justify-center font-bold text-sm">
              03
            </span>
            <h3 className="text-lg font-bold text-[#0E1118]">Save &amp; Sync</h3>
            <p className="text-xs text-[#5B5750] leading-relaxed">
              Save your frequent destinations locally in your browser with zero login, and seamlessly merge them to your account upon signing in.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: ROADMAP / PHASES */}
      <section className="py-20 bg-white border-y border-[#111111]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
              <span className="text-[#E8542F]">05 /</span>
              <span>PROJECT PHASES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] font-display">
              Development Timeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-[18px] bg-[#F7F5F0] border border-[#E1DDD3] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#5B5750]">PHASE 01</span>
                <span className="text-emerald-700 font-bold">✓ COMPLETED</span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1118]">Graph Engine &amp; Data</h3>
              <p className="text-xs text-[#5B5750]">Ingested 48 buildings, 1,957 topological nodes, Dijkstra and A* path solvers.</p>
            </div>

            <div className="p-5 rounded-[18px] bg-[#F7F5F0] border border-[#E1DDD3] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#5B5750]">PHASE 02</span>
                <span className="text-emerald-700 font-bold">✓ COMPLETED</span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1118]">Interactive Vector Map</h3>
              <p className="text-xs text-[#5B5750]">SVG vector projection canvas, zoom/pan deadzone, and responsive bottom drawer.</p>
            </div>

            <div className="p-5 rounded-[18px] bg-gradient-to-b from-[#151B28] to-[#0F141F] text-white border border-[#E8542F] space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#E8542F] font-bold">PHASE 03</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E8542F] text-white text-[9px] font-bold uppercase animate-pulse">CURRENT</span>
              </div>
              <h3 className="text-sm font-bold text-white">Auth &amp; Cloud Sync</h3>
              <p className="text-xs text-[#B4BCCB]">Argon2id sessions, Google OAuth, mobile OTP, and guest bookmark synchronization.</p>
            </div>

            <div className="p-5 rounded-[18px] bg-[#F7F5F0] border border-[#E1DDD3] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#5B5750]">PHASE 04</span>
                <span className="text-[#5B5750]">PLANNED</span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1118]">Indoor &amp; Real-Time</h3>
              <p className="text-xs text-[#5B5750]">Multi-floor indoor corridor meshes, campus shuttle GPS tracking, and offline PWA.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: THE DEVELOPER */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
            <span className="text-[#E8542F]">06 /</span>
            <span>THE DEVELOPER</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] font-display">
            Engineering &amp; Architecture
          </h2>
        </div>

        <div className="p-8 sm:p-12 rounded-[24px] bg-white border border-[#E1DDD3] shadow-md max-w-4xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Portrait Slot / Monogram Fallback */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#151B28] to-[#0F141F] text-white flex items-center justify-center font-mono font-black text-2xl border-2 border-[#E8542F] shadow-md shrink-0">
              {DEVELOPER_PROFILE.monogram}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#0E1118]">
                {DEVELOPER_PROFILE.name}
              </h3>
              <p className="text-xs font-mono text-[#E8542F] font-bold uppercase tracking-wider">
                {DEVELOPER_PROFILE.role}
              </p>
              <p className="text-sm text-[#5B5750] max-w-xl leading-relaxed font-sans pt-1">
                {DEVELOPER_PROFILE.bio}
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E1DDD3]">
            {DEVELOPER_PROFILE.links.github && (
              <a
                href={DEVELOPER_PROFILE.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-[#F7F5F0] hover:bg-[#111111] text-[#0E1118] hover:text-white border border-[#E1DDD3] text-xs font-mono font-semibold transition-colors flex items-center gap-2"
              >
                <span>GitHub</span>
                <span className="text-[#E8542F]">↗</span>
              </a>
            )}

            {DEVELOPER_PROFILE.links.linkedin && (
              <a
                href={DEVELOPER_PROFILE.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-[#F7F5F0] hover:bg-[#111111] text-[#0E1118] hover:text-white border border-[#E1DDD3] text-xs font-mono font-semibold transition-colors flex items-center gap-2"
              >
                <span>LinkedIn</span>
                <span className="text-[#E8542F]">↗</span>
              </a>
            )}

            {DEVELOPER_PROFILE.links.email && (
              <a
                href={`mailto:${DEVELOPER_PROFILE.links.email}`}
                className="px-4 py-2 rounded-full bg-[#F7F5F0] hover:bg-[#111111] text-[#0E1118] hover:text-white border border-[#E1DDD3] text-xs font-mono font-semibold transition-colors flex items-center gap-2"
              >
                <span>Contact</span>
                <span className="text-[#E8542F]">&rarr;</span>
              </a>
            )}
          </div>

          {/* Built With Tags */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#5B5750] uppercase tracking-wider block">
              PRIMARY TECHNOLOGIES &amp; SPECIALIZATIONS
            </span>
            <div className="flex flex-wrap gap-2">
              {DEVELOPER_PROFILE.builtWith.map((tech, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-[#F7F5F0] text-[#0E1118] border border-[#E1DDD3] text-[11px] font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: DATA & CREDITS */}
      <section className="py-16 bg-[#F2F0EB] border-t border-[#111111]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#5B5750]">
            <span className="text-[#E8542F]">07 /</span>
            <span>CREDITS &amp; ATTRIBUTION</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-[#5B5750] leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-bold text-[#0E1118] uppercase tracking-wider font-mono text-[11px]">
                Map Data &amp; Demonstration Dataset
              </h4>
              <p>
                Map walkway geometry and path geometries derived from{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#E8542F]"
                >
                  OpenStreetMap contributors (ODbL)
                </a>
                . The demonstration campus model utilizes topological survey data from Carleton University in Ottawa, Canada.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#0E1118] uppercase tracking-wider font-mono text-[11px]">
                Independent Project Disclaimer
              </h4>
              <p className="italic">
                CampusWay is an independent demonstration project and is not affiliated with, sponsored by, or endorsed by Carleton University or its administration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: DARK CTA BAND */}
      <section className="relative py-24 bg-gradient-to-b from-[#151B28] to-[#0F141F] text-white overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          <span className="text-xs font-mono text-[#E8542F] font-bold tracking-widest uppercase">
            EVERY PLACE HAS A WAY.
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display">
            Find Yours Today.
          </h2>
          <p className="text-sm sm:text-base text-[#B4BCCB] max-w-xl mx-auto">
            Experience real-time graph routing, step-free corridors, and architectural wayfinding across your campus.
          </p>
          <div className="pt-2">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#E8542F] hover:bg-[#C9411F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-98"
            >
              <span>EXPLORE CAMPUS NOW</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Shared Footer with big CAMPUSWAY watermark */}
      <EditorialFooter />
    </div>
  );
}
