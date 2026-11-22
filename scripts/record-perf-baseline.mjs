/**
 * Records API latency, client Dijkstra times, and Next.js map-related bundle sizes.
 * Usage: node scripts/record-perf-baseline.mjs
 */
import { writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

const API = process.env.API_BASE || "http://127.0.0.1:8000";
const FRONTEND = join(process.cwd(), "frontend");

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function timeRequest(fn, n = 20) {
  const samples = [];
  for (let i = 0; i < n; i += 1) {
    const t0 = performance.now();
    try {
      await fn();
      samples.push(performance.now() - t0);
    } catch (err) {
      samples.push(null);
      if (i === 0) console.warn("request failed:", err.message || err);
    }
  }
  const ok = samples.filter((s) => s != null).sort((a, b) => a - b);
  return {
    attempts: n,
    successes: ok.length,
    p50: ok.length ? Number(percentile(ok, 50).toFixed(2)) : null,
    p95: ok.length ? Number(percentile(ok, 95).toFixed(2)) : null,
    min: ok.length ? Number(ok[0].toFixed(2)) : null,
    max: ok.length ? Number(ok[ok.length - 1].toFixed(2)) : null,
  };
}

async function jsonFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, acc);
    else acc.push({ path: p, size: st.size });
  }
  return acc;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clientDijkstra(originId, destId, nodes, segments) {
  const adj = new Map();
  for (const n of nodes) adj.set(n.id, []);
  for (const seg of segments) {
    const src = nodes.find((n) => n.survey_id === seg.from || n.id === seg.from);
    const tgt = nodes.find((n) => n.survey_id === seg.to || n.id === seg.to);
    if (src && tgt) {
      adj.get(src.id).push({ target: tgt.id, dist: seg.distance_m });
      adj.get(tgt.id).push({ target: src.id, dist: seg.distance_m });
    }
  }
  const dist = new Map(nodes.map((n) => [n.id, Infinity]));
  dist.set(originId, 0);
  const visited = new Set();
  while (visited.size < nodes.length) {
    let u = null;
    let min = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < min) {
        min = d;
        u = id;
      }
    }
    if (!u || min === Infinity) break;
    if (u === destId) break;
    visited.add(u);
    for (const e of adj.get(u) || []) {
      const alt = dist.get(u) + e.dist;
      if (alt < dist.get(e.target)) dist.set(e.target, alt);
    }
  }
  return dist.get(destId);
}

async function main() {
  const recordedAt = new Date().toISOString();
  let health = null;
  try {
    health = await jsonFetch(`${API}/health`);
  } catch {
    health = { status: "unreachable" };
  }

  const searchStats = await timeRequest(
    () => jsonFetch(`${API}/api/v1/locations/?query=block&is_verified=true&limit=50`)
  );
  const nodesStats = await timeRequest(() => jsonFetch(`${API}/api/v1/routing/nodes`));

  let routeStats = { attempts: 20, successes: 0, p50: null, p95: null, min: null, max: null };
  let typicalPairs = [];
  try {
    const nodes = await jsonFetch(`${API}/api/v1/routing/nodes`);
    const locations = await jsonFetch(
      `${API}/api/v1/locations/?is_verified=true&limit=100`
    );
    const bySlug = Object.fromEntries((locations || []).map((l) => [l.slug, l]));
    const nodeByLocation = new Map();
    for (const n of nodes) {
      if (n.location_id && !nodeByLocation.has(n.location_id)) {
        nodeByLocation.set(n.location_id, n.id);
      }
    }
    const pairSlugs = [
      ["gate-1", "block-1"],
      ["gate-1", "block-2"],
      ["block-1", "cc-food-court"],
      ["block-8", "gh-2"],
      ["visitor-parking", "uni-hospital"],
    ];
    const pairs = pairSlugs
      .map(([from, to]) => {
        const a = bySlug[from];
        const b = bySlug[to];
        if (!a || !b) return null;
        return {
          from,
          to,
          origin: nodeByLocation.get(a.id),
          dest: nodeByLocation.get(b.id),
        };
      })
      .filter((p) => p && p.origin && p.dest);

    if (pairs.length) {
      const first = pairs[0];
      routeStats = await timeRequest(() =>
        jsonFetch(`${API}/api/v1/routing/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin_node_id: first.origin,
            destination_node_id: first.dest,
            algorithm: "dijkstra",
            accessible_only: false,
          }),
        })
      );

      for (const p of pairs) {
        const t0 = performance.now();
        await jsonFetch(`${API}/api/v1/routing/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin_node_id: p.origin,
            destination_node_id: p.dest,
            algorithm: "dijkstra",
            accessible_only: false,
          }),
        });
        typicalPairs.push({
          from: p.from,
          to: p.to,
          ms: Number((performance.now() - t0).toFixed(2)),
          source: "api",
        });
      }
    }
  } catch (err) {
    console.warn("API route measurement skipped:", err.message);
  }

  // Client-side Dijkstra on Dataset C (survey IDs) — same graph the frontend fallback uses.
  const surveyNodes = [
    { id: "G1-ENTRY" },
    { id: "J-001" },
    { id: "J-002" },
    { id: "HOSTEL-GATE-ENTRY" },
    { id: "MAIN-GATE-PARKING" },
    { id: "BALDEV-RAJ-MITTAL-PARK" },
    { id: "J-003" },
    { id: "J-004" },
    { id: "UNIVERSITY-HOSPITAL" },
    { id: "BALDEV-RAJ-MITTAL-AUDITORIUM" },
    { id: "BLOCK-1-FASHION-DESIGN" },
    { id: "J-005" },
    { id: "J-006" },
    { id: "J-007" },
    { id: "CC-FOOD-COURT" },
    { id: "BLOCK-2" },
    { id: "J-008" },
    { id: "J-009" },
    { id: "TRACER" },
    { id: "BLOCK-8" },
    { id: "J-010" },
    { id: "BLOCK-8C" },
    { id: "GH2-SECURITY-OFFICE" },
    { id: "GH-2" },
    { id: "J-011" },
    { id: "MB-FOOD-SQUARE" },
    { id: "J-012" },
  ].map((n) => ({ ...n, survey_id: n.id }));
  const surveySegments = [
    { from: "G1-ENTRY", to: "J-001", distance_m: 123.0 },
    { from: "J-001", to: "J-002", distance_m: 55.0 },
    { from: "J-002", to: "HOSTEL-GATE-ENTRY", distance_m: 79.5 },
    { from: "MAIN-GATE-PARKING", to: "J-001", distance_m: 73.3 },
    { from: "J-001", to: "BALDEV-RAJ-MITTAL-PARK", distance_m: 58.9 },
    { from: "J-001", to: "J-003", distance_m: 94.4 },
    { from: "J-003", to: "UNIVERSITY-HOSPITAL", distance_m: 47.7 },
    { from: "J-003", to: "J-004", distance_m: 50.9 },
    { from: "J-004", to: "UNIVERSITY-HOSPITAL", distance_m: 53.9 },
    { from: "J-004", to: "BALDEV-RAJ-MITTAL-AUDITORIUM", distance_m: 67.7 },
    { from: "J-004", to: "BLOCK-1-FASHION-DESIGN", distance_m: 141.6 },
    { from: "BALDEV-RAJ-MITTAL-AUDITORIUM", to: "BLOCK-1-FASHION-DESIGN", distance_m: 90.7 },
    { from: "J-004", to: "J-005", distance_m: 65.3 },
    { from: "BALDEV-RAJ-MITTAL-AUDITORIUM", to: "J-005", distance_m: 27.8 },
    { from: "J-006", to: "J-007", distance_m: 66.1 },
    { from: "J-006", to: "CC-FOOD-COURT", distance_m: 51.4 },
    { from: "J-006", to: "BLOCK-2", distance_m: 32.2 },
    { from: "J-007", to: "J-008", distance_m: 45.1 },
    { from: "J-003", to: "J-009", distance_m: 172.2 },
    { from: "J-007", to: "TRACER", distance_m: 25.9 },
    { from: "J-008", to: "BLOCK-8", distance_m: 22.1 },
    { from: "J-009", to: "J-010", distance_m: 35.8 },
    { from: "J-010", to: "BLOCK-8C", distance_m: 14.9 },
    { from: "J-010", to: "GH2-SECURITY-OFFICE", distance_m: 37.5 },
    { from: "J-010", to: "GH-2", distance_m: 42.3 },
    { from: "J-010", to: "J-011", distance_m: 49.0 },
    { from: "J-011", to: "MB-FOOD-SQUARE", distance_m: 219.5 },
    { from: "J-011", to: "J-012", distance_m: 31.5 },
    { from: "J-008", to: "J-009", distance_m: 45.1 },
  ];
  const clientPairIds = [
    ["G1-ENTRY", "BLOCK-1-FASHION-DESIGN", "gate-1", "block-1"],
    ["G1-ENTRY", "BLOCK-2", "gate-1", "block-2"],
    ["BLOCK-1-FASHION-DESIGN", "CC-FOOD-COURT", "block-1", "cc-food-court"],
    ["BLOCK-8", "GH-2", "block-8", "gh-2"],
    ["MAIN-GATE-PARKING", "UNIVERSITY-HOSPITAL", "visitor-parking", "uni-hospital"],
  ];
  const clientPairs = clientPairIds.map(([o, d, from, to]) => {
    const samples = [];
    for (let i = 0; i < 50; i += 1) {
      const t0 = performance.now();
      clientDijkstra(o, d, surveyNodes, surveySegments);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    return {
      from,
      to,
      ms: Number(samples[Math.floor(samples.length / 2)].toFixed(3)),
      source: "client-dijkstra",
    };
  });
  void haversineMeters;

  const nextStatic = join(FRONTEND, ".next/static");
  const files = walkFiles(nextStatic);
  const mapRelated = files.filter((f) =>
    /mapbox|map-gl|CampusMap|explore/i.test(f.path)
  );
  const jsTotal = files
    .filter((f) => f.path.endsWith(".js"))
    .reduce((s, f) => s + f.size, 0);

  const report = {
    recordedAt,
    apiBase: API,
    health,
    endpoints: {
      "GET /api/v1/locations/?query=block": searchStats,
      "GET /api/v1/routing/nodes": nodesStats,
      "POST /api/v1/routing/calculate": routeStats,
    },
    typicalRoutePairsApiMs: typicalPairs,
    typicalRoutePairsClientMs: clientPairs,
    bundle: {
      nextStaticJsBytes: jsTotal,
      nextStaticJsKiB: Number((jsTotal / 1024).toFixed(1)),
      mapRelatedFiles: mapRelated.map((f) => ({
        file: f.path.replace(FRONTEND, "frontend"),
        bytes: f.size,
      })),
      note: "Map first-render / TTI captured separately via Playwright on /explore.",
    },
  };

  const outJson = join(process.cwd(), "docs", "perf-baseline.raw.json");
  writeFileSync(outJson, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
