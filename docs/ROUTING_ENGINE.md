# CampusWay — Routing Engine & Pathfinding Documentation

## 1. Overview
The CampusWay routing engine calculates optimal pedestrian paths across Lovely Professional University's extensive campus. It supports wheelchair accessibility constraints, bidirectional and directed pathways, step-by-step turn directions, and realistic walking duration estimates.

---

## 2. In-Memory Graph Architecture (`CampusGraph`)

To guarantee millisecond route computation times, the graph is constructed directly from active PostgreSQL nodes and edges into an in-memory topological adjacency representation:

```python
class CampusGraph:
    def __init__(self):
        # Maps node UUID string -> node attributes (lat, lon, node_type, is_accessible)
        self.nodes: Dict[str, Dict[str, Any]] = {}
        # Maps node UUID string -> List of outgoing edges
        self.adjacency_list: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
```

### Graph Loading Rules:
- Only active nodes (`is_active = True`) are loaded.
- Only active edges (`is_active = True`) with both endpoints present in active nodes are loaded.
- Bidirectional edges (`is_bidirectional = True`) automatically create both forward $(u \to v)$ and reverse $(v \to u)$ adjacency entries.
- Directed edges (`is_bidirectional = False`) only create forward entries $(u \to v)$.
- Edge distance weights must be positive ($d > 0$ meters).

---

## 3. Pathfinding Algorithms

### 3.1 Predecessor-Backtracking Dijkstra's Algorithm
The core pathfinding engine implements Dijkstra's algorithm with priority queue optimization using Python's `heapq`:

$$\text{Priority Queue Entry}: (\text{cumulative\_distance}, \text{current\_node\_id})$$

```python
def dijkstra_shortest_path(
    graph: CampusGraph,
    origin_id: str,
    destination_id: str,
    accessible_only: bool = False,
) -> Optional[Dict[str, Any]]:
```

#### Memory Optimization (Predecessor Tracking):
Earlier implementations often placed the entire node sequence in each heap item, creating $O(V \cdot E)$ memory overhead. The current engine maintains a predecessor map:
$$\text{predecessors}[v] = (u, \text{edge\_data})$$
Upon reaching the destination node, the optimal path is reconstructed in $O(L)$ time by backtracking from destination to origin.

### 3.2 A* (A-Star) Pathfinding
For long-distance routes across large campus sections, A* is available via `algorithm="astar"`.
- **Heuristic Function**: Haversine great-circle distance between current node coordinate $(lat_1, lon_1)$ and destination coordinate $(lat_2, lon_2)$.
- **Admissibility**: Because the Euclidean / Haversine distance is always less than or equal to actual walkable surface distance, $h(n) \le d(n)$, ensuring admissibility and guaranteed optimality.

---

## 4. Navigation Directions & Turn Estimation

### 4.1 Geographic Bearing Calculation
The engine calculates the initial bearing $\theta$ between consecutive coordinates using the spherical forward azimuth formula:

$$\theta = \text{atan2}(\sin(\Delta \lambda) \cos(\phi_2), \cos(\phi_1)\sin(\phi_2) - \sin(\phi_1)\cos(\phi_2)\cos(\Delta \lambda))$$

Where $\phi$ is latitude and $\lambda$ is longitude in radians. The result is normalized to $[0^\circ, 360^\circ)$.

### 4.2 Turn Angle Difference & Instruction Generation
By comparing the incoming segment bearing $\theta_{\text{in}}$ with the outgoing segment bearing $\theta_{\text{out}}$:

$$\Delta \theta = (\theta_{\text{out}} - \theta_{\text{in}} + 180^\circ) \pmod{360^\circ} - 180^\circ$$

- $|\Delta \theta| \le 30^\circ$: `"Continue straight along the <path_type>"`
- $30^\circ < \Delta \theta \le 120^\circ$: `"Turn right onto the <path_type>"`
- $-120^\circ \le \Delta \theta < -30^\circ$: `"Turn left onto the <path_type>"`
- $|\Delta \theta| > 120^\circ$: `"Make a sharp turn / turn around onto the <path_type>"`

---

## 5. Walking Time Estimation

Walking duration is computed dynamically based on distance and configurable pedestrian speed:

$$\text{duration (seconds)} = \frac{\text{total\_distance\_m}}{\text{walking\_speed\_mps}}$$

- **Default Walking Speed**: `1.3 m/s` (~4.7 km/h), configured via `settings.DEFAULT_WALKING_SPEED_MPS`.
- Results provide both raw seconds and user-friendly minutes (e.g. `96.5` seconds, `1.6` minutes).
- Walking times are presented as estimates, clearly indicated to frontend users.

---

## 6. Algorithmic Complexity

| Component | Time Complexity | Space Complexity |
| :--- | :--- | :--- |
| Graph Construction from DB | $O(V + E)$ | $O(V + E)$ |
| Dijkstra Pathfinding | $O((V + E) \log V)$ | $O(V)$ |
| A* Pathfinding | $O(E \log V)$ average | $O(V)$ |
| Direction Step Synthesis | $O(L)$ where $L = \text{path length}$ | $O(L)$ |

---

## 7. Edge Cases & Robustness Handled

1. **Same Origin and Destination**: Returns `distance = 0.0`, single origin node, empty segments list in $O(1)$ time.
2. **Disconnected / Unreachable Target**: Returns `None` (resulting in HTTP 404 with descriptive detail).
3. **Invalid Endpoints**: Non-existent node IDs fail gracefully with HTTP 404.
4. **Inactive Nodes or Edges**: Graph loader excludes inactive vertices and edges before pathfinding begins.
5. **Accessibility Constraints**: When `accessible_only=True`, pathways containing stairs or non-wheelchair ramps are strictly excluded.
