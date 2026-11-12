# CampusWay — Explore Page Stability & API Request Loop Fix Report

**Date:** November 12, 2026  
**Target Branch:** `demo/submission-mvp`  
**Repository:** `06Pseudo06/Campus-Navigation`  
**Milestone:** Explore Page Runtime Stability & Network Request Loop Prevention  

---

## 1. Executive Summary

An investigation was conducted into the observed runtime instability on the `/explore` page. The reported issues included:
1. Continuous flashing of "Fetching live campus destinations..." over already-rendered destination cards.
2. An infinite refetch loop of live campus destinations and routing nodes.
3. Automatic and repeated route calculations executing on every click, render, or algorithm change.
4. Route flickering and navigation guidance instability.

The root causes have been diagnosed and permanently resolved. All 12 architectural stability invariants were verified, and the frontend passes TypeScript type checking, ESLint static analysis, and production Next.js webpack build with **zero errors and zero warnings**.

---

## 2. Root Cause Analysis

### 2.1 Infinite Destination Refetch Loop
- **Mechanism:** In `frontend/src/app/explore/page.tsx`, `calculateRoutePath` listed `[nodeMap]` in its dependency array. `loadCampusData` listed `[calculateRoutePath, selectedAlgorithm, user]` in its dependency array. Inside `loadCampusData`, `setNodeMap(newNodeMap)` created a new `Map` reference after fetching nodes.
- **Cascading Trigger:** `setNodeMap` -> recreated `calculateRoutePath` -> recreated `loadCampusData` -> triggered `useEffect([loadCampusData])` -> called `loadCampusData()` -> infinite loop. Additionally, any reference change in `user` (from an unmemoized `AuthContext`) or `selectedAlgorithm` restarted the entire data load sequence.

### 2.2 Destination Panel Loading Banner Flashing
- **Mechanism:** In `frontend/src/components/dashboard/DestinationPanel.tsx`, the loading indicator checked only `isLoadingLocations`.
- **Impact:** Whenever background fetches or refetches ran, the loading card rendered at the top of the destination list, causing visual jitter and flashing even when 48 destination cards were already present in state.

### 2.3 Unwanted Automatic Route Calculations
- **Mechanism:** 
  1. `loadCampusData` automatically called `calculateRoutePath(defaultOrigin, defaultDest)` on completion of initial fetch.
  2. `handleSelectLocation`, `handleSelectOriginLocation`, and `handleSelectAlgorithm` each invoked `calculateRoutePath` immediately upon user selection.
- **Impact:** Clicking any destination card or changing algorithm triggered automatic backend routing requests (`POST /api/v1/routing/calculate`) without explicit user intent, causing route state churn and race conditions.

### 2.4 Race Conditions and In-Flight Request Churn
- **Mechanism:** Neither destination loading nor route calculations carried `AbortController` signals or request sequence identifiers.
- **Impact:** Out-of-order network responses from rapid selections could overwrite newer state with stale route data.

### 2.5 Unmemoized Context Provider Value
- **Mechanism:** `AuthContext.tsx` exported an unmemoized object literal in `<AuthContext.Provider value={{ user, loading, logout, refreshUser }}>`.
- **Impact:** Every render of `AuthProvider` created a new context object reference, forcing re-evaluation of downstream hooks and components.

---

## 3. Remediation Details

### 3.1 Migration of `nodeMap` from State to Ref (`explore/page.tsx`)
- Converted `const [nodeMap, setNodeMap] = useState<Map<string, NodeRead>>` to:
  ```typescript
  const nodeMapRef = useRef<Map<string, NodeRead>>(new Map());
  ```
- Because `nodeMap` is only needed when formatting waypoints for an active route (`routeService.formatRouteModel`), storing it in a ref decouples graph node caching from React render cycles.

### 3.2 Stabilization of `calculateRoutePath` & `loadCampusData`
- Isolated `calculateRoutePath` with `[]` dependency array. Added in-flight request cancellation:
  ```typescript
  if (isCalculatingRouteRef.current) {
    routeAbortControllerRef.current?.abort();
  }
  const controller = new AbortController();
  routeAbortControllerRef.current = controller;
  const requestId = ++routeRequestIdRef.current;
  ```
- Stale responses are discarded if `requestId !== routeRequestIdRef.current` or `controller.signal.aborted`.
- Isolated `loadCampusData` with `[]` dependency array. Guarded against concurrent runs via `isFetchingLocationsRef` and `destinationsAbortControllerRef`.
- Guarded mount execution with `hasInitializedRef` to eliminate React StrictMode duplicate fetches.
- **Removed** automatic route calculation from `loadCampusData`.

### 3.3 Separation of Selection from Route Calculation
- `handleSelectLocation`: Updates `selectedLocation`, invalidates mismatched `activeRoute`, does **not** calculate.
- `handleSelectOriginLocation`: Updates `originLocation`, invalidates mismatched `activeRoute`, does **not** calculate.
- `handleSelectAlgorithm`: Updates `selectedAlgorithm`, invalidates `activeRoute`, does **not** calculate.
- `handleManualCalculate`: Bound exclusively to the "Calculate Route" button in `DestinationPanel.tsx`.
- `handleSelectPredefinedRoute`: Preserved in Routes tab for intentional predefined route queries.

### 3.4 Destination Panel Guarding (`DestinationPanel.tsx`)
- Loading banner now only displays on initial cold start before any data exists:
  ```tsx
  {isLoadingLocations && locations.length === 0 && (
    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-300">
      <Spinner className="w-4 h-4 text-[#DE4B31]" />
      <span>Fetching live campus destinations...</span>
    </div>
  )}
  ```
- Added cleanup for `saveNoticeTimerRef` on unmount.

### 3.5 Context Provider Memoization (`AuthContext.tsx`)
- Wrapped `logout` in `useCallback`.
- Wrapped `contextValue` in `useMemo<AuthContextType>`.

### 3.6 Signal Propagation in Services
- Added optional `signal?: AbortSignal` to `locationService.searchLocations`, `locationService.getVisitorDestinations`, `routeService.getNodesForLocation`, `routeService.getAllNodes`, and `routeService.calculateRoute`.

---

## 4. Verification & Audit Results

| Check / Tool | Target | Expected | Result |
| :--- | :--- | :--- | :---: |
| `npm --prefix frontend run type-check` | TypeScript Compiler | 0 errors | **PASS** |
| `npm --prefix frontend run lint` | ESLint 9 | 0 errors, 0 warnings | **PASS** |
| `npm --prefix frontend run build` | Next.js Webpack Build | Static pages generated (8/8) | **PASS** |
| `audit_explore_stability.py` | 12 Architectural Invariants | 12/12 Invariants Passed | **PASS** |

### Verified Architectural Invariants:
1. `nodeMap` Ref Migration: `nodeMap` is held in `useRef`, eliminating re-render cascading.
2. `calculateRoutePath` Stability: `calculateRoutePath` has `[]` dependencies, stable across all renders.
3. Route Request Guarding: In-flight route calculation is aborted when superseded; stale responses ignored via `requestId`.
4. `loadCampusData` Idempotency: `loadCampusData` has `[]` dependencies and ref guard against concurrent execution.
5. StrictMode Double-Fetch Protection: `hasInitializedRef` prevents duplicate initial API queries in StrictMode.
6. Selection Isolation (Destination): `handleSelectLocation` updates selection without triggering calculation.
7. Selection Isolation (Origin): `handleSelectOriginLocation` updates origin without triggering calculation.
8. Selection Isolation (Algorithm): `handleSelectAlgorithm` updates algorithm state without triggering calculation.
9. Explicit User Calculation: `handleManualCalculate` is bound exclusively to explicit calculate button click.
10. Persistent Destination Display: Loading banner never overlays or replaces loaded destination cards.
11. Timer Cleanup: `saveNoticeTimerRef` is cleared on unmount to prevent memory leaks.
12. AuthContext Memoization: Auth context provider value and logout are memoized with `useMemo`/`useCallback`.
13. Services AbortSignal: `locationService` and `routeService` pass `AbortSignal` through to `apiClient`.

