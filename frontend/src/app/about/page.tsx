"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { EditorialFooter } from "@/components/home/EditorialFooter";
import { CustomCursor } from "@/components/motion/CustomCursor";
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

  // Animated counters for key numbers
  const [bldgCount, setBldgCount] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  useEffect(() => {
    if (isReducedMotion()) {
      const raf = requestAnimationFrame(() => {
        setBldgCount(38);
        setNodeCount(1957);
        setEdgeCount(124);
      });
      return () => cancelAnimationFrame(raf);
    }

    const duration = 1200;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setBldgCount(Math.round(38 * ease));
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
      className="relative min-h-screen w-full bg-[#F6F4EF] dark:bg-[#070B14] text-[#0E1118] dark:text-zinc-100 overflow-x-hidden selection:bg-[#E8452C] selection:text-white transition-colors duration-200"
    >
      <CustomCursor />

      {/* Sitewide Navbar */}
      <Navbar />

      {/* SECTION 1: HERO */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Headline & Overview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
              <span className="text-[#E8452C]">&mdash;</span>
              <span>ABOUT / THE PROJECT</span>
              <span className="w-12 h-px bg-slate-300 dark:bg-zinc-700 inline-block" />
            </div>

            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white leading-[0.95] font-display">
              Built to help you{" "}
              <span className="font-display font-black italic text-[#E8452C]">
                arrive.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 font-sans leading-relaxed max-w-2xl">
              CampusWay is an architectural campus navigation and wayfinding platform designed
              for Lovely Professional University. Built with dual Dijkstra and A* graph engines,
              sub-meter topological survey snapping, and client-side privacy.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/explore"
                className="px-6 py-3.5 rounded-full bg-[#0E1118] dark:bg-white hover:bg-[#E8452C] dark:hover:bg-[#E8452C] text-white dark:text-[#0E1118] dark:hover:text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-xl hover:scale-102 active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <span>EXPLORE CAMPUS MAP</span>
                <span className="text-[#E8452C] group-hover:text-white font-bold">&rarr;</span>
              </Link>

              <Link
                href="/help"
                className="px-6 py-3.5 rounded-full bg-white dark:bg-[#0e1422] hover:bg-slate-100 dark:hover:bg-zinc-800 text-[#0E1118] dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
              >
                VISITOR ASSISTANCE
              </Link>
            </div>
          </div>

          {/* Right Column: Architectural Visual Card with Sun Disc */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Sun Disc */}
            <div
              className="absolute -top-6 -right-6 w-44 h-44 rounded-full bg-gradient-to-br from-[#f97316] to-[#E8452C] opacity-90 shadow-xl pointer-events-none -z-0"
              aria-hidden="true"
            >
              <div className="absolute -inset-3 rounded-full border border-[#E8452C]/30" />
            </div>

            {/* Photo Card with Verified Atlas badge */}
            <div className="relative w-full max-w-md aspect-4/3 rounded-3xl overflow-hidden border border-slate-300 dark:border-zinc-700/80 shadow-2xl z-10 bg-[#0E1118]">
              <Image
                src="/images/01_graph_solver.png"
                alt="Architectural perspective of modern university facilities"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white font-mono text-[10px]">
                <span>CAMPUSWAY ATLAS &bull; LPU PHAGWARA</span>
                <span className="text-[#E8452C] font-bold">✦ DATASET C</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: KEY NUMBERS */}
      <section className="py-12 bg-white dark:bg-[#0a0f1d] border-y border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              BLOCKS INDEXED
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#0E1118] dark:text-white tabular-nums font-sans">
              {bldgCount} Blocks
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              GRAPH NODES
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#0E1118] dark:text-white tabular-nums font-sans">
              {nodeCount.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              SURVEYED EDGES
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#0E1118] dark:text-white tabular-nums font-sans">
              {edgeCount}+
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              ROUTING LATENCY
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#E8452C] tabular-nums font-sans">
              &lt; 2 ms
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW ROUTING WORKS */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
            <span className="text-[#E8452C]">02 /</span>
            <span>HOW ROUTING WORKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display">
            Mathematical Precision, Real Walking Guidance
          </h2>
        </div>

        {/* SVG Flow Diagram that draws itself */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#0F141F] text-white border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-400">
            DATA FLOW PIPELINE &bull; ASYNC GRAPH ENGINE
          </div>

          <svg
            ref={flowSvgRef}
            viewBox="0 0 900 160"
            className="w-full h-auto min-h-[120px] max-w-4xl mx-auto"
          >
            {/* Step 1: Browser */}
            <g transform="translate(60, 40)">
              <rect x="0" y="0" width="140" height="70" rx="12" fill="#151B28" stroke="#E8452C" strokeWidth="1.5" />
              <text x="70" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">Browser UI</text>
              <text x="70" y="50" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="var(--font-mono)">Next.js 16 App</text>
            </g>

            {/* Path 1 -> 2 */}
            <path d="M 200 75 L 280 75" fill="none" stroke="#E8452C" strokeWidth="2.5" className="flow-draw-path" strokeLinecap="round" />
            <polygon points="280,75 272,70 272,80" fill="#E8452C" />

            {/* Step 2: FastAPI */}
            <g transform="translate(285, 40)">
              <rect x="0" y="0" width="140" height="70" rx="12" fill="#151B28" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <text x="70" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">API Gateway</text>
              <text x="70" y="50" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="var(--font-mono)">FastAPI (Python)</text>
            </g>

            {/* Path 2 -> 3 */}
            <path d="M 425 75 L 505 75" fill="none" stroke="#E8452C" strokeWidth="2.5" className="flow-draw-path" strokeLinecap="round" />
            <polygon points="505,75 497,70 497,80" fill="#E8452C" />

            {/* Step 3: Solver */}
            <g transform="translate(510, 40)">
              <rect x="0" y="0" width="150" height="70" rx="12" fill="#151B28" stroke="#0F6E73" strokeWidth="1.5" />
              <text x="75" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">Graph Engine</text>
              <text x="75" y="50" textAnchor="middle" fill="#8FE3D6" fontSize="9" fontFamily="var(--font-mono)">Dijkstra / A* Solvers</text>
            </g>

            {/* Path 3 -> 4 */}
            <path d="M 660 75 L 735 75" fill="none" stroke="#E8452C" strokeWidth="2.5" className="flow-draw-path" strokeLinecap="round" />
            <polygon points="735,75 727,70 727,80" fill="#E8452C" />

            {/* Step 4: Storage */}
            <g transform="translate(740, 40)">
              <rect x="0" y="0" width="130" height="70" rx="12" fill="#151B28" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <text x="65" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-sans)" fontWeight="bold">Topology Store</text>
              <text x="65" y="50" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="var(--font-mono)">SQLite / Dataset C</text>
            </g>
          </svg>

          {/* 4 Captions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/10 text-xs text-slate-300">
            <div>
              <span className="text-[#E8452C] font-mono font-bold block mb-1">01 / LPU WALKWAYS</span>
              <p>GPS surveyed paths across Uni-Mall, Central Spine, and Academic Blocks establish the mesh.</p>
            </div>
            <div>
              <span className="text-[#E8452C] font-mono font-bold block mb-1">02 / GRAPH SNAPPING</span>
              <p>Dynamic projection snaps real device GPS to surveyed pathway segments within a 75m corridor.</p>
            </div>
            <div>
              <span className="text-[#E8452C] font-mono font-bold block mb-1">03 / DUAL SOLVERS</span>
              <p>Dijkstra ensures strict global optimality, while A* applies Haversine heuristics for fast calculation.</p>
            </div>
            <div>
              <span className="text-[#E8452C] font-mono font-bold block mb-1">04 / STEP-FREE ACCESS</span>
              <p>Stairs and steep slopes are filtered out dynamically when wheelchair accessibility is toggled.</p>
            </div>
          </div>
        </div>

        {/* Two-Column Dijkstra vs A* Explainer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold uppercase tracking-tight text-[#0E1118] dark:text-white">
                Dijkstra&apos;s Algorithm
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#E8452C]/10 text-[#E8452C] text-[10px] font-mono font-bold uppercase border border-[#E8452C]/20">
                GUARANTEED OPTIMAL
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Explores nodes uniformly in concentric waves based on cumulative edge distance. It mathematically guarantees the absolute shortest route across complex pedestrian grids, with binary-heap priority queue performance.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold uppercase tracking-tight text-[#0E1118] dark:text-white">
                A* Search Algorithm
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-300 dark:border-emerald-800/60">
                HEURISTIC ACCELERATED
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Combines path distance with an admissible Haversine great-circle distance heuristic pointing toward the destination node. It prunes non-promising branches, calculating routes in under 1.2 milliseconds.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: ARCHITECTURE STACK */}
      <section className="py-20 bg-slate-100/70 dark:bg-[#0a0f1d] border-t border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
              <span className="text-[#E8452C]">03 /</span>
              <span>ENGINEERING STACK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display">
              Production Architecture
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { code: "NX", name: "Next.js 16", role: "App Router, Server Components & React" },
              { code: "TS", name: "TypeScript", role: "Strict Static Type Contracts & Models" },
              { code: "TW", name: "Tailwind CSS", role: "Semantic Tokens & Dark Mode" },
              { code: "FA", name: "FastAPI", role: "Asynchronous Python ASGI Microservice" },
              { code: "PY", name: "Python Graph", role: "Dijkstra & A* Network Solvers" },
              { code: "MB", name: "Mapbox GL JS", role: "Hardware-Accelerated 3D Map Engine" },
              { code: "QR", name: "QR Navigation", role: "Kiosk Signboards & Web Scanner" },
              { code: "JW", name: "JWT & Sessions", role: "Argon2id & Cookie Authentication" },
              { code: "GO", name: "Google OAuth", role: "OpenID Connect Federated Sign-In" },
              { code: "GS", name: "GSAP & Motion", role: "ScrollTrigger & Kinetic Feedback" },
            ].map((st, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 hover:border-[#E8452C] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0E1118] dark:bg-zinc-800 text-white group-hover:bg-[#E8452C] transition-colors flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                  {st.code}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0E1118] dark:text-white font-sans">{st.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug mt-0.5">{st.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURES */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
            <span className="text-[#E8452C]">04 /</span>
            <span>CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display">
            Core Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-[#E8452C]/10 text-[#E8452C] flex items-center justify-center font-bold text-sm">
              01
            </span>
            <h3 className="text-lg font-bold text-[#0E1118] dark:text-white">Discover &amp; Search</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Find academic blocks, food courts, libraries, hostels, and gates with instant fuzzy search and category filters.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-[#E8452C]/10 text-[#E8452C] flex items-center justify-center font-bold text-sm">
              02
            </span>
            <h3 className="text-lg font-bold text-[#0E1118] dark:text-white">Smart Routing</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Calculate turn-by-turn walking directions with distance and estimated time. Toggle step-free accessible routes free of obstacles.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-[#E8452C]/10 text-[#E8452C] flex items-center justify-center font-bold text-sm">
              03
            </span>
            <h3 className="text-lg font-bold text-[#0E1118] dark:text-white">Privacy &amp; QR Kiosks</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Scan signboards to immediately initiate routes. Your real-time GPS location remains private on your device with zero server tracking.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: ROADMAP / PHASES */}
      <section className="py-20 bg-white dark:bg-[#0a0f1d] border-y border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
              <span className="text-[#E8452C]">05 /</span>
              <span>PROJECT PHASES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display">
              Development Timeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-zinc-400">PHASE 01</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ COMPLETED</span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1118] dark:text-white">Graph Engine &amp; Data</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Ingested LPU Dataset C, 1,957 nodes, Dijkstra and A* path solvers.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-zinc-400">PHASE 02</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ COMPLETED</span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1118] dark:text-white">Map Engine &amp; GPS/QR</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Mapbox GL hardware tiles, GPS snapping, QR signboards, and live puck.</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#151B28] to-[#0F141F] text-white border border-[#E8452C] space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#E8452C] font-bold">PHASE 03</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E8452C] text-white text-[9px] font-bold uppercase animate-pulse">CURRENT</span>
              </div>
              <h3 className="text-sm font-bold text-white">Full UI &amp; Accessibility</h3>
              <p className="text-xs text-slate-300">Light/Dark tokens, 5-tab settings, bottom sheet, and visitor assistance.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-zinc-400">PHASE 04</span>
                <span className="text-slate-400 dark:text-zinc-500">PLANNED</span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1118] dark:text-white">Indoor &amp; Multi-Floor</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Corridor-level indoor routing, campus shuttle tracking, and offline PWA.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: THE DEVELOPER */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
            <span className="text-[#E8452C]">06 /</span>
            <span>THE DEVELOPER</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white font-display">
            Engineering &amp; Architecture
          </h2>
        </div>

        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-zinc-800 shadow-md max-w-4xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Monogram Portrait Slot */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#151B28] to-[#0F141F] text-white flex items-center justify-center font-mono font-black text-2xl border-2 border-[#E8452C] shadow-md shrink-0">
              {DEVELOPER_PROFILE.monogram}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#0E1118] dark:text-white">
                {DEVELOPER_PROFILE.name}
              </h3>
              <p className="text-xs font-mono text-[#E8452C] font-bold uppercase tracking-wider">
                {DEVELOPER_PROFILE.role}
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-xl leading-relaxed font-sans pt-1">
                {DEVELOPER_PROFILE.bio}
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
            {DEVELOPER_PROFILE.links.github && (
              <a
                href={DEVELOPER_PROFILE.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-[#0E1118] dark:hover:bg-white text-[#0E1118] dark:text-zinc-200 hover:text-white dark:hover:text-[#0E1118] border border-slate-300 dark:border-zinc-700 text-xs font-mono font-semibold transition-colors flex items-center gap-2"
              >
                <span>GitHub</span>
                <span className="text-[#E8452C]">↗</span>
              </a>
            )}

            {DEVELOPER_PROFILE.links.linkedin && (
              <a
                href={DEVELOPER_PROFILE.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-[#0E1118] dark:hover:bg-white text-[#0E1118] dark:text-zinc-200 hover:text-white dark:hover:text-[#0E1118] border border-slate-300 dark:border-zinc-700 text-xs font-mono font-semibold transition-colors flex items-center gap-2"
              >
                <span>LinkedIn</span>
                <span className="text-[#E8452C]">↗</span>
              </a>
            )}

            {DEVELOPER_PROFILE.links.email && (
              <a
                href={`mailto:${DEVELOPER_PROFILE.links.email}`}
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-[#0E1118] dark:hover:bg-white text-[#0E1118] dark:text-zinc-200 hover:text-white dark:hover:text-[#0E1118] border border-slate-300 dark:border-zinc-700 text-xs font-mono font-semibold transition-colors flex items-center gap-2"
              >
                <span>Contact</span>
                <span className="text-[#E8452C]">&rarr;</span>
              </a>
            )}
          </div>

          {/* Built With Tags */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              PRIMARY TECHNOLOGIES &amp; SPECIALIZATIONS
            </span>
            <div className="flex flex-wrap gap-2">
              {DEVELOPER_PROFILE.builtWith.map((tech, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[#0E1118] dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 text-[11px] font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: DATA & CREDITS */}
      <section className="py-16 bg-slate-100/70 dark:bg-[#0a0f1d] border-t border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
            <span className="text-[#E8452C]">07 /</span>
            <span>CREDITS &amp; ATTRIBUTION</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-bold text-[#0E1118] dark:text-white uppercase tracking-wider font-mono text-[11px]">
                Map Data &amp; Campus Dataset
              </h4>
              <p>
                Map walkway geometry and building contours derived from field topological surveys across Lovely Professional University in Phagwara, Punjab. All routing graphs respect verified pedestrian paths.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#0E1118] dark:text-white uppercase tracking-wider font-mono text-[11px]">
                Independent Project Disclaimer
              </h4>
              <p className="italic">
                CampusWay is an independent navigation engineering demonstration project built for educational, accessibility, and architectural wayfinding purposes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: DARK CTA BAND */}
      <section className="relative py-24 bg-gradient-to-b from-[#151B28] to-[#0F141F] text-white overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          <span className="text-xs font-mono text-[#E8452C] font-bold tracking-widest uppercase">
            EVERY PLACE HAS A WAY.
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display">
            Find Yours Today.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Experience real-time graph routing, step-free corridors, and architectural wayfinding across your campus.
          </p>
          <div className="pt-2">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#E8452C] hover:bg-[#d03d27] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-98"
            >
              <span>EXPLORE CAMPUS NOW</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Shared Footer */}
      <EditorialFooter />
    </div>
  );
}
