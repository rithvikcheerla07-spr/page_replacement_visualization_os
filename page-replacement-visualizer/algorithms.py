"""
Page Replacement Algorithms Module
==================================

Implements core virtual memory page replacement algorithms:
- FIFO (First In, First Out)
- LRU (Least Recently Used)
- Optimal (OPT / Belady's Min)

Also provides unified runners, comparative analysis, and frame-scaling
evaluators with Belady's anomaly detection.
"""

from typing import Any, Dict, List, Optional


def _validate_inputs(reference_string: List[int], frame_count: int) -> None:
    """Validate reference string and frame count arguments."""
    if not isinstance(frame_count, int) or frame_count < 1:
        raise ValueError(
            f"Frame count must be an integer greater than or equal to 1. Received: {frame_count}"
        )
    if not isinstance(reference_string, (list, tuple)):
        raise ValueError(
            f"Reference string must be a list or tuple of integers. Received: {type(reference_string).__name__}"
        )
    for idx, page in enumerate(reference_string):
        if not isinstance(page, int):
            raise ValueError(
                f"Invalid page value at index {idx}: '{page}'. All pages must be integers."
            )


def _build_summary(
    algorithm: str,
    reference_string: List[int],
    frame_count: int,
    steps: List[Dict[str, Any]],
    total_hits: int,
    total_faults: int,
) -> Dict[str, Any]:
    """Calculate standard summary statistics ensuring hits + faults == total_references."""
    total_refs = len(reference_string)
    if total_refs > 0:
        hit_ratio = total_hits / total_refs
        fault_ratio = total_faults / total_refs
    else:
        hit_ratio = 0.0
        fault_ratio = 0.0

    return {
        "algorithm": algorithm,
        "frame_count": frame_count,
        "reference_string": list(reference_string),
        "total_references": total_refs,
        "hits": total_hits,
        "faults": total_faults,
        "hit_ratio": round(hit_ratio, 4),
        "fault_ratio": round(fault_ratio, 4),
        "hit_percentage": round(hit_ratio * 100.0, 2),
        "fault_percentage": round(fault_ratio * 100.0, 2),
        "steps": steps,
    }


def fifo(reference_string: List[int], frame_count: int) -> Dict[str, Any]:
    """
    Simulate First In, First Out (FIFO) page replacement.

    When memory is full and a page fault occurs, evicts the page that has been in
    memory the longest (earliest insertion order). Page hits DO NOT alter the
    queue/insertion order.
    """
    _validate_inputs(reference_string, frame_count)

    frames: List[int] = []  # Current resident pages in memory
    insertion_queue: List[int] = []  # Tracks FIFO order of pages
    steps: List[Dict[str, Any]] = []
    total_hits = 0
    total_faults = 0

    for idx, page in enumerate(reference_string, start=1):
        evicted: Optional[int] = None

        if page in frames:
            total_hits += 1
            result = "HIT"
            explanation = (
                f"Page {page} is already resident in frame {frames.index(page) + 1}. "
                f"No replacement needed (FIFO order unchanged)."
            )
        else:
            total_faults += 1
            result = "FAULT"
            if len(frames) < frame_count:
                frames.append(page)
                insertion_queue.append(page)
                explanation = (
                    f"Page fault: Page {page} loaded into empty frame {len(frames)}."
                )
            else:
                evicted = insertion_queue.pop(0)
                evict_idx = frames.index(evicted)
                frames[evict_idx] = page
                insertion_queue.append(page)
                explanation = (
                    f"Page fault: Memory full. Page {evicted} (oldest in memory) "
                    f"evicted from frame {evict_idx + 1} and replaced by page {page}."
                )

        # Pad frame display to fixed frame_count for clear visualization
        display_frames: List[Optional[int]] = list(frames) + [None] * (frame_count - len(frames))

        steps.append({
            "step": idx,
            "page": page,
            "frames": display_frames,
            "resident_pages": list(frames),
            "result": result,
            "evicted": evicted,
            "explanation": explanation,
            "hits": total_hits,
            "faults": total_faults,
        })

    return _build_summary("FIFO", reference_string, frame_count, steps, total_hits, total_faults)


def lru(reference_string: List[int], frame_count: int) -> Dict[str, Any]:
    """
    Simulate Least Recently Used (LRU) page replacement.

    When memory is full and a page fault occurs, evicts the page that has not
    been accessed for the longest time. Every access (hit or fault) updates the
    recency record of that page.
    """
    _validate_inputs(reference_string, frame_count)

    frames: List[int] = []
    # Recency order: index 0 is least recently used, end is most recently used
    recency_order: List[int] = []
    steps: List[Dict[str, Any]] = []
    total_hits = 0
    total_faults = 0

    for idx, page in enumerate(reference_string, start=1):
        evicted: Optional[int] = None

        if page in frames:
            total_hits += 1
            result = "HIT"
            # Update recency: move accessed page to the end (most recent)
            recency_order.remove(page)
            recency_order.append(page)
            explanation = (
                f"Page {page} found in frame {frames.index(page) + 1} (HIT). "
                f"Marked as most recently used."
            )
        else:
            total_faults += 1
            result = "FAULT"
            if len(frames) < frame_count:
                frames.append(page)
                recency_order.append(page)
                explanation = (
                    f"Page fault: Page {page} loaded into empty frame {len(frames)}."
                )
            else:
                # Evict least recently used (first element of recency_order)
                evicted = recency_order.pop(0)
                evict_idx = frames.index(evicted)
                frames[evict_idx] = page
                recency_order.append(page)
                explanation = (
                    f"Page fault: Memory full. Page {evicted} (least recently used) "
                    f"evicted from frame {evict_idx + 1} and replaced by page {page}."
                )

        display_frames: List[Optional[int]] = list(frames) + [None] * (frame_count - len(frames))

        steps.append({
            "step": idx,
            "page": page,
            "frames": display_frames,
            "resident_pages": list(frames),
            "result": result,
            "evicted": evicted,
            "explanation": explanation,
            "hits": total_hits,
            "faults": total_faults,
        })

    return _build_summary("LRU", reference_string, frame_count, steps, total_hits, total_faults)


def optimal(reference_string: List[int], frame_count: int) -> Dict[str, Any]:
    """
    Simulate Optimal (OPT / Belady's Min) page replacement.

    When memory is full and a page fault occurs, looks ahead into the future
    reference string and evicts the resident page that will not be used for the
    longest period of time. If a page is never referenced again, it has infinite
    distance and is prioritized for eviction.
    """
    _validate_inputs(reference_string, frame_count)

    frames: List[int] = []
    steps: List[Dict[str, Any]] = []
    total_hits = 0
    total_faults = 0

    total_len = len(reference_string)

    for idx, page in enumerate(reference_string, start=1):
        evicted: Optional[int] = None

        if page in frames:
            total_hits += 1
            result = "HIT"
            explanation = (
                f"Page {page} found in frame {frames.index(page) + 1} (HIT). "
                f"No replacement needed."
            )
        else:
            total_faults += 1
            result = "FAULT"
            if len(frames) < frame_count:
                frames.append(page)
                explanation = (
                    f"Page fault: Page {page} loaded into empty frame {len(frames)}."
                )
            else:
                # Look ahead to find next access for each resident page
                future_refs = reference_string[idx:]  # Slice after current step
                farthest_page = frames[0]
                max_future_distance = -1

                candidate_explanations = []

                for resident in frames:
                    if resident not in future_refs:
                        # Page is never referenced again -> distance is infinity
                        distance = float("inf")
                        candidate_explanations.append(f"{resident} (never again)")
                    else:
                        distance = future_refs.index(resident)
                        candidate_explanations.append(f"{resident} (in {distance + 1} steps)")

                    if distance > max_future_distance:
                        max_future_distance = distance
                        farthest_page = resident

                evicted = farthest_page
                evict_idx = frames.index(evicted)
                frames[evict_idx] = page

                next_dist_str = (
                    "never referenced again"
                    if max_future_distance == float("inf")
                    else f"next needed farthest in future"
                )
                explanation = (
                    f"Page fault: Memory full. Page {evicted} ({next_dist_str}) "
                    f"evicted from frame {evict_idx + 1} and replaced by page {page}."
                )

        display_frames: List[Optional[int]] = list(frames) + [None] * (frame_count - len(frames))

        steps.append({
            "step": idx,
            "page": page,
            "frames": display_frames,
            "resident_pages": list(frames),
            "result": result,
            "evicted": evicted,
            "explanation": explanation,
            "hits": total_hits,
            "faults": total_faults,
        })

    return _build_summary("Optimal", reference_string, frame_count, steps, total_hits, total_faults)


def run_algorithm(
    algorithm: str, reference_string: List[int], frame_count: int
) -> Dict[str, Any]:
    """
    Dispatch function to run any supported algorithm by name.

    Supported names: 'FIFO', 'LRU', 'Optimal' (case-insensitive).
    """
    algo_clean = algorithm.strip().upper()
    if algo_clean in ("FIFO", "FIRST IN, FIRST OUT"):
        return fifo(reference_string, frame_count)
    elif algo_clean in ("LRU", "LEAST RECENTLY USED"):
        return lru(reference_string, frame_count)
    elif algo_clean in ("OPTIMAL", "OPT", "MIN", "BELADY'S MIN"):
        return optimal(reference_string, frame_count)
    else:
        raise ValueError(
            f"Unknown algorithm: '{algorithm}'. Supported algorithms: 'FIFO', 'LRU', 'Optimal'."
        )


def compare_algorithms(
    reference_string: List[int], frame_count: int
) -> Dict[str, Any]:
    """
    Execute FIFO, LRU, and Optimal simultaneously on identical input.

    Returns comparison summaries, best-performing algorithm(s), and step-by-step
    cumulative fault traces for plotting.
    """
    fifo_res = fifo(reference_string, frame_count)
    lru_res = lru(reference_string, frame_count)
    opt_res = optimal(reference_string, frame_count)

    results = {
        "FIFO": fifo_res,
        "LRU": lru_res,
        "Optimal": opt_res,
    }

    # Determine best algorithm (minimum faults)
    min_faults = min(res["faults"] for res in results.values())
    best_algorithms = [
        name for name, res in results.items() if res["faults"] == min_faults
    ]

    # Cumulative fault vectors for line chart
    steps_count = len(reference_string)
    cumulative_traces = {
        "steps": list(range(1, steps_count + 1)),
        "FIFO": [s["faults"] for s in fifo_res["steps"]],
        "LRU": [s["faults"] for s in lru_res["steps"]],
        "Optimal": [s["faults"] for s in opt_res["steps"]],
    }

    return {
        "reference_string": list(reference_string),
        "frame_count": frame_count,
        "results": results,
        "best_algorithms": best_algorithms,
        "min_faults": min_faults,
        "is_tie": len(best_algorithms) > 1,
        "cumulative_traces": cumulative_traces,
    }


def analyze_frames(
    reference_string: List[int], max_frames: int = 10
) -> Dict[str, Any]:
    """
    Evaluate FIFO, LRU, and Optimal across frame counts from 1 to max_frames.

    Checks for Belady's anomaly (where increasing frame capacity leads to
    an increase in page faults). Belady's anomaly can occur in FIFO, but
    stack algorithms like LRU and Optimal are immune.
    """
    if not isinstance(max_frames, int) or max_frames < 1:
        raise ValueError(
            f"max_frames must be an integer >= 1. Received: {max_frames}"
        )

    frame_range = list(range(1, max_frames + 1))
    analysis_data: List[Dict[str, Any]] = []

    fifo_faults: List[int] = []
    lru_faults: List[int] = []
    opt_faults: List[int] = []

    for f in frame_range:
        f_fifo = fifo(reference_string, f)
        f_lru = lru(reference_string, f)
        f_opt = optimal(reference_string, f)

        fifo_faults.append(f_fifo["faults"])
        lru_faults.append(f_lru["faults"])
        opt_faults.append(f_opt["faults"])

        analysis_data.append({
            "frames": f,
            "FIFO_faults": f_fifo["faults"],
            "FIFO_hits": f_fifo["hits"],
            "FIFO_hit_ratio": f_fifo["hit_ratio"],
            "LRU_faults": f_lru["faults"],
            "LRU_hits": f_lru["hits"],
            "LRU_hit_ratio": f_lru["hit_ratio"],
            "Optimal_faults": f_opt["faults"],
            "Optimal_hits": f_opt["hits"],
            "Optimal_hit_ratio": f_opt["hit_ratio"],
        })

    # Detect Belady's anomaly: any transition from f to f+1 where faults strictly increase
    belady_anomalies: List[Dict[str, Any]] = []
    for i in range(len(frame_range) - 1):
        f_curr = frame_range[i]
        f_next = frame_range[i + 1]

        if fifo_faults[i + 1] > fifo_faults[i]:
            belady_anomalies.append({
                "algorithm": "FIFO",
                "lower_frames": f_curr,
                "higher_frames": f_next,
                "faults_lower": fifo_faults[i],
                "faults_higher": fifo_faults[i + 1],
                "difference": fifo_faults[i + 1] - fifo_faults[i],
            })

    return {
        "max_frames": max_frames,
        "frame_range": frame_range,
        "data": analysis_data,
        "fifo_faults": fifo_faults,
        "lru_faults": lru_faults,
        "opt_faults": opt_faults,
        "has_belady_anomaly": len(belady_anomalies) > 0,
        "belady_anomalies": belady_anomalies,
    }
