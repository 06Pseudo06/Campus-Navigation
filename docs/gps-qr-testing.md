# CampusWay GPS & QR Navigation Testing Guide

This guide details how to verify, test, and debug GPS location services and QR navigation across desktop, mobile, and simulated environments.

---

## 1. Architecture & Privacy Principles

1. **Strict Client-Side Privacy**:
   - CampusWay never transmits raw user coordinates (latitude, longitude, accuracy) to the backend API or any third party.
   - GPS coordinates are snapped to the nearest surveyed graph node entirely inside the browser (`gpsSnapping.ts`).
   - The routing request only sends verified graph node IDs or location slugs (e.g., `origin=gate-1&destination=block-1`), ensuring full location privacy.

2. **Feature Flags**:
   - `NEXT_PUBLIC_FEATURE_GPS` (default: `true` in dev): Toggles all geolocation hooks, UI markers, and origin options.
   - `NEXT_PUBLIC_FEATURE_QR` (default: `true` in dev): Toggles QR generation, scanner modal, and deep linking.

3. **Secure Context Requirement**:
   - The browser `navigator.geolocation` API is restricted by web standards to secure origins (`https://` or `localhost`).
   - Testing on LAN IP addresses (e.g., `http://192.168.1.x:3000`) will report `insecure` or `unsupported`. Use localhost or an HTTPS tunnel.

---

## 2. Testing GPS Locally (Desktop)

### Option A: Built-in Developer GPS Mock Panel (Recommended)
On the `/explore` page in development mode (`IS_DEV === true`), a floating **"🧪 Dev GPS Mock"** pill appears at the bottom-left of the interactive map:

1. **Activate Preset Locations**:
   - **Main Gate 1 (Entrance)**: Snaps to Gate 1 node (`31.26128, 75.70014`), updates blue pulsing dot with heading.
   - **Block 1 (Computer Science)**: Snaps to Block 1 central academic block (`31.260565, 75.706815`).
   - **Block 30 / Central Spine**: Snaps to pedestrian walkway junction (`31.2585, 75.7042`).
   - **Near Block 34 (South Area)**: Snaps to South campus sector (`31.2568, 75.7035`).
   - **Uni-Mall**: Snaps to East campus dining and retail complex (`31.2625, 75.708`).
   - **Low Accuracy Fix (±68m)**: Simulates degraded GPS fix ($>50\text{m}$). The map renders a dashed yellow/amber accuracy halo and shows a *"Low accuracy (±68m)"* badge, ignoring it for node snapping to prevent erratic jumps.
   - **Outside Campus (Jalandhar Hwy)**: Simulates coordinates outside LPU campus bounds (`31.285, 75.65`). Triggers the non-blocking amber warning banner: *"Current location is outside LPU campus boundary"*.
2. **Custom Coordinates & Accuracy Slider**:
   - Enter arbitrary latitude and longitude coordinates.
   - Adjust the accuracy slider between $5\text{m}$ and $80\text{m}$.
   - Click **"Set Custom GPS"** to immediately update user location on the map.
3. **Reset to Hardware GPS**:
   - Click **"Reset to Device GPS"** to clear the mock state and return to browser geolocation.

### Option B: Chrome DevTools Sensors
1. Open DevTools (`F12` or `Ctrl+Shift+I`).
2. Press `Ctrl+Shift+P` -> Type `Show Sensors` -> Select **Sensors**.
3. Under **Location**, choose **Other...** and input campus coordinates:
   - Latitude: `31.260565`
   - Longitude: `75.706815`
4. Click the `<LocateButton />` (Crosshair icon) in CampusWay to trigger location acquisition.

---

## 3. Testing on Physical Mobile Devices

Because mobile browsers require HTTPS for Geolocation:

1. **Start Next.js and Backend**:
   - Backend running on `http://127.0.0.1:8000`
   - Next.js running on `http://localhost:3000`
2. **Expose via HTTPS Tunnel**:
   - **Cloudflare Tunnels (Quickest)**:
     ```bash
     cloudflared tunnel --url http://localhost:3000
     ```
   - **ngrok**:
     ```bash
     ngrok http 3000
     ```
3. **Open Tunnel URL on Mobile**:
   - Open the resulting `https://...` URL in mobile Safari or Chrome.
   - Tap the **Locate Me** crosshair button.
   - When prompted with *"CampusWay wants to use your device's location"*, tap **Allow**.
   - Verify:
     - Blue pulsing dot appears at your physical coordinates with a semi-transparent accuracy circle.
     - Origin picker displays **"My Current Location"** with a live GPS badge.
     - Selecting a destination automatically computes a walking route from your nearest snapped node.
     - Moving $> 15\text{m}$ triggers dynamic re-routing with a brief `(Re-routing…)` status.

---

## 4. Node Snapping & Dynamic Re-routing Logic

The snapping engine is implemented in `frontend/src/lib/gpsSnapping.ts`:

| Parameter | Threshold | Description |
| :--- | :--- | :--- |
| **Accuracy Threshold** | $\le 50\text{ m}$ | GPS fixes with accuracy $> 50\text{m}$ are marked `low_accuracy` and filtered out from snapping. |
| **Max Snap Distance** | $150\text{ m}$ | Maximum radius from a graph node. Beyond this, coordinates are flagged `out_of_range`. |
| **Spatial Indexing** | $0.001^\circ$ bins | $O(1)$ grid-based proximity lookup against Dataset C nodes. |
| **Re-routing Trigger** | $> 15\text{ m}$ moved | Recomputes shortest path when user moves $> 15\text{m}$ from the last routed position. |
| **Polyline Deviation** | $> 25\text{ m}$ off path | Triggers immediate re-route if perpendicular distance to route exceeds $25\text{m}$. |

---

## 5. Verification Checklist

- [x] Geolocation permission prompt is never triggered automatically on page load.
- [x] Clicking `<LocateButton />` requests location and updates map view.
- [x] Blue pulsing dot displays heading indicator when device orientation is available.
- [x] Accuracy circle scales accurately to GPS radius in meters.
- [x] "My Current Location" appears at the top of the origin selector.
- [x] Low accuracy warnings ($>50\text{m}$) and outside-campus warnings display non-blocking alerts.
- [x] Tab visibility change (Page Visibility API) pauses GPS watch to conserve battery.
- [x] Mock Location panel operates seamlessly in dev mode.

---

## 6. End-to-End QR Navigation Flow Testing

### Supported QR Payload Formats
CampusWay supports five distinct QR encoding formats:
1. **Canonical Web URL**: `https://campusway.lpu.in/navigate?to=block-1&from=gate-1`
2. **Relative Path**: `/navigate?to=block-1` or `/explore?to=block-2&from=gate-1`
3. **Prefixed Physical Signage**: `place:block-1` or `lpu:gate-1`
4. **Signage with Explicit Origin**: `place:block-2?from=gate-1`
5. **Direct Verified Slug/Code**: `block-1`, `gate-1`, `tracer`

### Origin Resolution Logic
When a QR payload is scanned:
1. **Explicit Origin**: If `from` parameter is included (e.g. `gate-1`), that location is immediately resolved.
2. **GPS Snapped Origin**: If no origin is provided, CampusWay checks if the user has a live GPS fix snapped to a verified node within $\le 45\text{m}$.
   - If snapped: sets origin to the current location, displays toast: *"Starting from your current location (<node name>)"*, and triggers route calculation.
3. **Origin Resolution Prompt**: If GPS is unavailable, denied, or $> 45\text{m}$ from campus graph nodes:
   - Displays a clean dialog: *"Where are you starting from?"*
   - Offers 1-tap quick chips for major gates (Gate 1, Hosteller Gate, Visitor Parking) and common buildings.
   - Includes real-time search across all campus locations.
   - Selecting a starting point immediately calculates the route and displays the Route Summary (Card B).

### Edge Case Handling
- **`to === from`**: If the scanned destination matches the current location/origin, CampusWay displays *"You are already at <name>!"* without executing unnecessary route calculations.
- **Active Route In-Progress**: Scanning a new QR smoothly cancels any in-flight route and calculates the new path.
- **Rapid Double-Scan Debounce**: Multiple decode events within $1500\text{ms}$ are debounced to prevent duplicate requests.
- **Unrecognized / Foreign QR**: Shows error toast *"Unknown QR code — not a recognized CampusWay location"* and keeps the scanner modal open for another attempt.
- **Offline Dijkstra Fallback**: If the backend API is unreachable, the client-side Dijkstra graph engine calculates the route offline using cached survey nodes.

### In-App Verification Methods
1. **In-App "Test this QR" Simulation Button**:
   - Open any location detail card in `/explore`.
   - Click the **QR Code** icon.
   - In the modal, click the primary red button **"Test this QR in App (Simulate Scan)"** (`data-testid="test-qr-button"`).
   - This immediately fires the navigation intent through the complete QR processing pipeline without needing a physical camera.
2. **Manual Code Entry**:
   - Open the QR Scanner modal.
   - Switch to **"Type a code"** manual input.
   - Enter any slug (e.g., `block-1`, `place:cc-food-court`, or `lpu:gate-1`) and submit.
3. **Deep Link Forwarding**:
   - Navigate directly to `http://localhost:3000/navigate?to=block-1&from=gate-1`.
   - The route is automatically validated, forwarded to `/explore`, calculated, and displayed in the Route Summary.

