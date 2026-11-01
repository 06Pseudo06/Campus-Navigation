"""Navigation step and human-readable instruction generation.

Transforms raw path node sequences and metric distances into turn-by-turn guidance,
walking duration estimates, and path type instructions.
"""

import math
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.services.routing.graph import CampusGraph


def calculate_walking_duration(
    distance_m: float,
    walking_speed_mps: Optional[float] = None,
) -> Tuple[float, float]:
    """Calculate estimated walking duration in seconds and minutes.
    
    Uses standard walking speed (default ~1.3 m/s ~= 4.7 km/h).
    Returns (duration_seconds, duration_minutes).
    """
    speed = walking_speed_mps or settings.DEFAULT_WALKING_SPEED_MPS
    if speed <= 0:
        speed = 1.3
    seconds = round(distance_m / speed, 1)
    minutes = round(seconds / 60.0, 1)
    return seconds, minutes


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geographic initial bearing from point 1 to point 2 in degrees [0, 360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - (math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda))
    initial_bearing = math.atan2(y, x)
    return (math.degrees(initial_bearing) + 360.0) % 360.0


def format_path_type_instruction(path_type: str, distance_m: float) -> str:
    """Generate base human-readable instruction for a path type."""
    pt = (path_type or "footpath").lower().strip()
    dist_str = f"{round(distance_m, 1)}m"

    if "stair" in pt:
        return f"Use the staircase for {dist_str}"
    elif "ramp" in pt:
        return f"Take the accessible ramp for {dist_str}"
    elif "cross" in pt:
        return f"Cross at the pedestrian walkway for {dist_str}"
    elif "corridor" in pt:
        return f"Follow the corridor for {dist_str}"
    elif "entrance" in pt or "door" in pt:
        return f"Enter through the access entrance ({dist_str})"
    else:
        return f"Follow {pt} for {dist_str}"


def generate_step_directions(
    graph: CampusGraph,
    path_nodes: List[str],
    raw_segments: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Convert raw path segments and node geometry into human-readable navigation steps."""
    if not raw_segments:
        return []

    enriched_segments: List[Dict[str, Any]] = []
    prev_bearing: Optional[float] = None

    for i, seg in enumerate(raw_segments):
        s_id = seg["source_node_id"]
        t_id = seg["target_node_id"]
        dist = seg["distance_m"]
        pt = seg["path_type"]

        s_node = graph.get_node(str(s_id))
        t_node = graph.get_node(str(t_id))

        curr_bearing: Optional[float] = None
        if (
            s_node
            and t_node
            and s_node.get("latitude") is not None
            and t_node.get("latitude") is not None
        ):
            curr_bearing = calculate_bearing(
                s_node["latitude"], s_node["longitude"],
                t_node["latitude"], t_node["longitude"]
            )

        # Determine turn modifier if bearing change exists
        instruction: str
        if prev_bearing is not None and curr_bearing is not None:
            delta = (curr_bearing - prev_bearing + 360.0) % 360.0
            if 45.0 <= delta <= 135.0:
                turn = "Turn right onto"
            elif 135.0 < delta <= 225.0:
                turn = "Make a U-turn onto"
            elif 225.0 < delta <= 315.0:
                turn = "Turn left onto"
            else:
                turn = "Continue straight along"
            instruction = f"{turn} {pt} for {round(dist, 1)}m"
        else:
            instruction = format_path_type_instruction(pt, dist)

        prev_bearing = curr_bearing

        enriched_segments.append({
            "source_node_id": s_id,
            "target_node_id": t_id,
            "distance_m": dist,
            "path_type": pt,
            "instruction": instruction,
            "is_accessible": seg.get("is_accessible", True),
            "edge_id": seg.get("edge_id"),
        })

    return enriched_segments
