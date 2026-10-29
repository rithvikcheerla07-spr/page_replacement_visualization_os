"""
Automated Test Suite for Page Replacement Algorithms
=====================================================

Tests FIFO, LRU, Optimal, comparisons, and frame analyses.
Includes validation for the standard textbook example and Belady's anomaly.
"""

import sys
import os
import pytest

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from algorithms import (
    fifo,
    lru,
    optimal,
    run_algorithm,
    compare_algorithms,
    analyze_frames,
)

# Standard textbook reference string
STANDARD_REFS = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]
STANDARD_FRAMES = 3

# Belady's anomaly benchmark string
BELADY_REFS = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]


class TestStandardExample:
    """Verify exact textbook counts for reference string [7,0,1,2,0,3,0,4,2,3,0,3,2] with 3 frames."""

    def test_fifo_standard(self):
        res = fifo(STANDARD_REFS, STANDARD_FRAMES)
        assert res["faults"] == 10, f"FIFO expected 10 faults, got {res['faults']}"
        assert res["hits"] == 3, f"FIFO expected 3 hits, got {res['hits']}"
        assert res["total_references"] == 13
        assert res["hits"] + res["faults"] == 13
        assert res["hit_ratio"] == round(3 / 13, 4)
        assert res["fault_ratio"] == round(10 / 13, 4)

    def test_lru_standard(self):
        res = lru(STANDARD_REFS, STANDARD_FRAMES)
        assert res["faults"] == 9, f"LRU expected 9 faults, got {res['faults']}"
        assert res["hits"] == 4, f"LRU expected 4 hits, got {res['hits']}"
        assert res["total_references"] == 13
        assert res["hits"] + res["faults"] == 13
        assert res["hit_ratio"] == round(4 / 13, 4)
        assert res["fault_ratio"] == round(9 / 13, 4)

    def test_optimal_standard(self):
        res = optimal(STANDARD_REFS, STANDARD_FRAMES)
        assert res["faults"] == 7, f"Optimal expected 7 faults, got {res['faults']}"
        assert res["hits"] == 6, f"Optimal expected 6 hits, got {res['hits']}"
        assert res["total_references"] == 13
        assert res["hits"] + res["faults"] == 13
        assert res["hit_ratio"] == round(6 / 13, 4)
        assert res["fault_ratio"] == round(7 / 13, 4)


class TestAlgorithmMechanics:
    """Test detailed step-by-step frame mechanics and invariants."""

    def test_fifo_hit_does_not_alter_insertion_order(self):
        # Refs: 1, 2, 1, 3 with 2 frames
        # Step 1: 1 -> [1] (fault)
        # Step 2: 2 -> [1, 2] (fault)
        # Step 3: 1 -> [1, 2] (hit, 1 is still oldest in FIFO)
        # Step 4: 3 -> evict 1 (because 1 was inserted first), frames become [3, 2]
        refs = [1, 2, 1, 3]
        res = fifo(refs, 2)
        assert res["steps"][2]["result"] == "HIT"
        assert res["steps"][3]["result"] == "FAULT"
        assert res["steps"][3]["evicted"] == 1

    def test_lru_hit_updates_recency(self):
        # Refs: 1, 2, 1, 3 with 2 frames
        # Step 1: 1 -> [1] (fault)
        # Step 2: 2 -> [1, 2] (fault)
        # Step 3: 1 -> [1, 2] (hit, 1 is now MOST recently used, 2 is least recently used)
        # Step 4: 3 -> evict 2 (because 2 is LRU), frames become [1, 3]
        refs = [1, 2, 1, 3]
        res = lru(refs, 2)
        assert res["steps"][2]["result"] == "HIT"
        assert res["steps"][3]["result"] == "FAULT"
        assert res["steps"][3]["evicted"] == 2

    def test_optimal_eviction_decision(self):
        # Refs: 1, 2, 3, 4, 1, 2 with 3 frames
        # Step 1-3: 1, 2, 3 resident
        # Step 4: page 4 arrives. Lookahead: 1 appears at step 5, 2 appears at step 6, 3 NEVER appears.
        # Optimal must evict 3!
        refs = [1, 2, 3, 4, 1, 2]
        res = optimal(refs, 3)
        assert res["steps"][3]["evicted"] == 3

    def test_hits_never_evict(self):
        for algo_fn in [fifo, lru, optimal]:
            res = algo_fn(STANDARD_REFS, 3)
            for step in res["steps"]:
                if step["result"] == "HIT":
                    assert step["evicted"] is None, "A page hit must never evict a page"

    def test_frame_capacity_is_never_exceeded(self):
        for frame_count in [1, 2, 4, 5]:
            for algo_fn in [fifo, lru, optimal]:
                res = algo_fn(STANDARD_REFS, frame_count)
                for step in res["steps"]:
                    assert len(step["resident_pages"]) <= frame_count
                    assert len(step["frames"]) == frame_count

    def test_step_ordering_and_requests(self):
        res = fifo(STANDARD_REFS, 3)
        for idx, step in enumerate(res["steps"]):
            assert step["step"] == idx + 1
            assert step["page"] == STANDARD_REFS[idx]


class TestEdgeCasesAndValidation:
    """Test boundary conditions and error handling."""

    def test_empty_reference_string(self):
        for algo_fn in [fifo, lru, optimal]:
            res = algo_fn([], 3)
            assert res["total_references"] == 0
            assert res["hits"] == 0
            assert res["faults"] == 0
            assert res["hit_ratio"] == 0.0
            assert res["fault_ratio"] == 0.0
            assert res["steps"] == []

    def test_single_frame(self):
        refs = [1, 2, 1, 3]
        res_fifo = fifo(refs, 1)
        assert res_fifo["faults"] == 4  # every request is different from preceding
        assert res_fifo["hits"] == 0

    def test_single_page_repeated(self):
        refs = [5, 5, 5, 5, 5]
        res = lru(refs, 3)
        assert res["faults"] == 1
        assert res["hits"] == 4

    def test_invalid_frame_counts(self):
        with pytest.raises(ValueError):
            fifo(STANDARD_REFS, 0)
        with pytest.raises(ValueError):
            lru(STANDARD_REFS, -2)
        with pytest.raises(ValueError):
            optimal(STANDARD_REFS, "three")  # type: ignore

    def test_invalid_reference_string_elements(self):
        with pytest.raises(ValueError):
            fifo(["a", "b"], 3)  # type: ignore

    def test_run_algorithm_dispatcher(self):
        res1 = run_algorithm("FIFO", STANDARD_REFS, 3)
        assert res1["faults"] == 10
        res2 = run_algorithm("lru", STANDARD_REFS, 3)
        assert res2["faults"] == 9
        res3 = run_algorithm("Optimal", STANDARD_REFS, 3)
        assert res3["faults"] == 7

        with pytest.raises(ValueError):
            run_algorithm("RANDOM_REPLACEMENT", STANDARD_REFS, 3)


class TestComparisonAndAnalysis:
    """Test comparison and frame scaling functions."""

    def test_compare_algorithms(self):
        comp = compare_algorithms(STANDARD_REFS, 3)
        assert "FIFO" in comp["results"]
        assert "LRU" in comp["results"]
        assert "Optimal" in comp["results"]
        assert comp["best_algorithms"] == ["Optimal"]
        assert comp["min_faults"] == 7
        assert comp["is_tie"] is False

    def test_beladys_anomaly_demonstration(self):
        """
        Verify Belady's anomaly:
        Reference string: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
        FIFO with 3 frames produces 9 page faults.
        FIFO with 4 frames produces 10 page faults.
        """
        fifo_3 = fifo(BELADY_REFS, 3)
        fifo_4 = fifo(BELADY_REFS, 4)

        assert fifo_3["faults"] == 9, f"FIFO with 3 frames expected 9 faults, got {fifo_3['faults']}"
        assert fifo_4["faults"] == 10, f"FIFO with 4 frames expected 10 faults, got {fifo_4['faults']}"
        assert fifo_4["faults"] > fifo_3["faults"], "Belady's anomaly must exhibit increased faults"

        # Check analyze_frames detects it
        analysis = analyze_frames(BELADY_REFS, max_frames=6)
        assert analysis["has_belady_anomaly"] is True
        anomaly_found = any(
            a["lower_frames"] == 3 and a["higher_frames"] == 4 for a in analysis["belady_anomalies"]
        )
        assert anomaly_found, "analyze_frames must identify the 3 -> 4 frame Belady anomaly"
