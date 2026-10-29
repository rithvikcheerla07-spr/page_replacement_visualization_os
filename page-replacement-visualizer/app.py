"""
Page Replacement Visualization System - Streamlit Dashboard
============================================================

Interactive educational dashboard for studying and benchmarking virtual memory
page replacement algorithms (FIFO, LRU, Optimal).
"""

import time
import random
from typing import List, Tuple
import streamlit as st
import pandas as pd
import plotly.graph_objects as go

from algorithms import (
    fifo,
    lru,
    optimal,
    run_algorithm,
    compare_algorithms,
    analyze_frames,
)

# -----------------------------------------------------------------------------
# Page Configuration & Styling
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Page Replacement Visualization System",
    page_icon="🖥️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for polished educational styling (Navy, restrained blue, crisp indicators)
st.markdown(
    """
    <style>
    /* Global font & background adjustments */
    .main {
        background-color: #f8fafc;
    }
    h1, h2, h3 {
        color: #0f294a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 700;
    }
    .metric-card {
        background: #ffffff;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        text-align: center;
    }
    .frame-box {
        display: inline-block;
        border-radius: 8px;
        padding: 14px;
        margin: 6px;
        min-width: 90px;
        text-align: center;
        font-weight: 700;
        font-size: 1.25rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        border: 2px solid #cbd5e1;
        background-color: #ffffff;
    }
    .frame-box-active {
        border-color: #2563eb !important;
        background-color: #eff6ff !important;
        color: #1e40af !important;
    }
    .frame-box-empty {
        border-color: #e2e8f0 !important;
        background-color: #f1f5f9 !important;
        color: #94a3b8 !important;
        font-style: italic;
    }
    .badge-hit {
        display: inline-block;
        background-color: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
        padding: 4px 12px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.95rem;
    }
    .badge-fault {
        display: inline-block;
        background-color: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
        padding: 4px 12px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.95rem;
    }
    .analogy-box {
        background: linear-gradient(135deg, #f0f7ff 0%, #e0edfd 100%);
        border-left: 5px solid #2563eb;
        padding: 16px 20px;
        border-radius: 0 8px 8px 0;
        margin: 14px 0;
        color: #1e3a8a;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


def parse_reference_string(raw_str: str) -> Tuple[List[int], str]:
    """Parse comma-separated or space-separated string of integer page numbers."""
    if not raw_str or not raw_str.strip():
        return [], "Reference string is empty."

    # Replace spaces with commas and split
    cleaned = raw_str.replace(" ", ",")
    tokens = [t.strip() for t in cleaned.split(",") if t.strip()]

    pages: List[int] = []
    for token in tokens:
        try:
            val = int(token)
            if val < 0:
                return [], f"Page numbers cannot be negative (found '{token}')."
            pages.append(val)
        except ValueError:
            return [], f"Invalid page token '{token}'. Only integer values are accepted."

    if not pages:
        return [], "No valid integers found in reference string."

    return pages, ""


# -----------------------------------------------------------------------------
# Session State Initialization
# -----------------------------------------------------------------------------
if "current_step" not in st.session_state:
    st.session_state.current_step = 1

if "is_playing" not in st.session_state:
    st.session_state.is_playing = False

if "ref_string_input" not in st.session_state:
    st.session_state.ref_string_input = "7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2"

if "frame_count_input" not in st.session_state:
    st.session_state.frame_count_input = 3

if "algo_input" not in st.session_state:
    st.session_state.algo_input = "FIFO"

if "auto_speed" not in st.session_state:
    st.session_state.auto_speed = 0.8

if "view_mode" not in st.session_state:
    st.session_state.view_mode = "Both (Step Focus + All Tasks Matrix)"


# -----------------------------------------------------------------------------
# Sidebar Configuration
# -----------------------------------------------------------------------------
with st.sidebar:
    st.image(
        "https://img.icons8.com/fluency/96/memory-slot.png",
        width=48,
    )
    st.title("Settings")
    st.caption("Configure memory references and simulation parameters")

    st.subheader("1. Reference String")
    ref_input_val = st.text_area(
        "Page Requests (comma-separated integers):",
        value=st.session_state.ref_string_input,
        help="Enter integers separated by commas. Default: standard OS textbook example.",
        key="sidebar_ref_input",
    )
    st.session_state.ref_string_input = ref_input_val

    # Random generator expander
    with st.expander("🎲 Random Reference Generator"):
        gen_len = st.number_input("Sequence Length", min_value=5, max_value=40, value=12, step=1)
        gen_max = st.number_input("Max Page ID", min_value=1, max_value=20, value=7, step=1)
        if st.button("Generate Random String", use_container_width=True):
            random_seq = [random.randint(0, int(gen_max)) for _ in range(int(gen_len))]
            st.session_state.ref_string_input = ", ".join(map(str, random_seq))
            st.session_state.current_step = 1
            st.session_state.is_playing = False
            st.rerun()

    st.divider()

    st.subheader("2. Physical Memory Frames")
    frame_count = st.slider(
        "Number of Frames (RAM capacity):",
        min_value=1,
        max_value=10,
        value=st.session_state.frame_count_input,
        help="Number of page slots simultaneously resident in physical memory.",
    )
    st.session_state.frame_count_input = frame_count

    st.divider()

    st.subheader("3. Algorithm")
    selected_algo = st.selectbox(
        "Page Replacement Policy:",
        options=["FIFO", "LRU", "Optimal"],
        index=["FIFO", "LRU", "Optimal"].index(st.session_state.algo_input),
        help="Select the page replacement algorithm to simulate in Tab 1.",
    )
    st.session_state.algo_input = selected_algo

    st.divider()

    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        if st.button("↺ Reset Progress", use_container_width=True):
            st.session_state.current_step = 1
            st.session_state.is_playing = False
            st.rerun()
    with col_btn2:
        if st.button("▶ Run Full", use_container_width=True):
            st.session_state.is_playing = False
            # Will evaluate parsed string
            parsed_pages, _ = parse_reference_string(st.session_state.ref_string_input)
            if parsed_pages:
                st.session_state.current_step = len(parsed_pages)
                st.rerun()

    st.caption("B.Tech OS Course-Based Project (CBP)")


# -----------------------------------------------------------------------------
# Input Validation & Computation
# -----------------------------------------------------------------------------
pages, error_msg = parse_reference_string(st.session_state.ref_string_input)

if error_msg:
    st.error(f"⚠️ Input Error: {error_msg}")
    st.stop()

if not pages:
    st.warning("Please specify at least one page reference.")
    st.stop()

# Clamp current_step
total_steps = len(pages)
st.session_state.current_step = max(1, min(st.session_state.current_step, total_steps))

# Run the selected algorithm for Tab 1
current_algo_sim = run_algorithm(selected_algo, pages, frame_count)


# -----------------------------------------------------------------------------
# Header & Desk Analogy Banner
# -----------------------------------------------------------------------------
st.title("Page Replacement Visualization System")
st.markdown(
    """
    <div class="analogy-box">
        <strong>📚 The Desk & Library Analogy:</strong>
        Imagine a student working at a small desk that holds only <strong>a few books at a time (RAM Memory Frames)</strong>.
        The university's vast library basement holds all available books <strong>(Hard Drive / Secondary Storage)</strong>.
        When the student needs a book already sitting on the desk, it is an instantaneous <strong>Page Hit</strong>.
        When the book is missing from the desk, a time-consuming <strong>Page Fault</strong> occurs:
        the student must retrieve it from the shelves, and if the desk is completely full, choose which book to return or set aside
        using a replacement strategy (FIFO, LRU, or Optimal).
    </div>
    """,
    unsafe_allow_html=True,
)


# -----------------------------------------------------------------------------
# Main Tabs
# -----------------------------------------------------------------------------
tab_sim, tab_comp, tab_frames, tab_learn = st.tabs(
    ["📊 1. Simulation", "⚖️ 2. Comparison", "📈 3. Frames Analysis", "📖 4. Learn"]
)


# =============================================================================
# TAB 1: SIMULATION
# =============================================================================
with tab_sim:
    st.header(f"{selected_algo} Interactive Simulation")

    algo_descriptions = {
        "FIFO": "First In, First Out evicts the resident page that was loaded into memory earliest, regardless of how frequently or recently it was accessed.",
        "LRU": "Least Recently Used evicts the page that has not been accessed for the longest period of time. Every page hit updates recency.",
        "Optimal": "Optimal (OPT / Belady's Min) evicts the resident page whose next access is farthest into the future. Serves as the theoretical gold standard.",
    }
    st.info(f"**Policy Principle:** {algo_descriptions[selected_algo]}")

    # Automated Simulation Launcher Bar
    st.markdown("##### 🚀 Automated Simulation Controls")
    auto_col1, auto_col2, auto_col3 = st.columns([2.2, 2.2, 1.6])

    with auto_col1:
        if not st.session_state.is_playing:
            if st.button("🚀 Auto-Simulate (Run Total Itself)", use_container_width=True, type="primary"):
                st.session_state.current_step = 1
                st.session_state.is_playing = True
                st.rerun()
        else:
            if st.button("⏸ Pause Auto-Simulation", use_container_width=True, type="secondary"):
                st.session_state.is_playing = False
                st.rerun()

    with auto_col2:
        if st.button("⚡ Run Total & Show All Tasks", use_container_width=True):
            st.session_state.current_step = total_steps
            st.session_state.is_playing = False
            st.rerun()

    with auto_col3:
        speed_choice = st.selectbox(
            "Playback Speed:",
            options=["Fast (0.3s)", "Normal (0.8s)", "Deliberate (1.4s)"],
            index=1,
            label_visibility="collapsed",
        )
        speed_map = {"Fast (0.3s)": 0.3, "Normal (0.8s)": 0.8, "Deliberate (1.4s)": 1.4}
        st.session_state.auto_speed = speed_map[speed_choice]

    st.write("")

    # Manual Stepping & Playback Controls
    ctrl_col1, ctrl_col2, ctrl_col3, ctrl_col4, ctrl_col5, ctrl_col6 = st.columns(
        [1.2, 1.2, 1.2, 1.2, 1.2, 2.5]
    )

    with ctrl_col1:
        if st.button("⏮ First", use_container_width=True):
            st.session_state.current_step = 1
            st.session_state.is_playing = False
            st.rerun()

    with ctrl_col2:
        if st.button("◀ Prev", use_container_width=True, disabled=(st.session_state.current_step <= 1)):
            st.session_state.current_step -= 1
            st.session_state.is_playing = False
            st.rerun()

    with ctrl_col3:
        if not st.session_state.is_playing:
            if st.button("▶ Step Next", use_container_width=True, disabled=(st.session_state.current_step >= total_steps)):
                st.session_state.current_step += 1
                st.session_state.is_playing = False
                st.rerun()
        else:
            if st.button("⏸ Pause", use_container_width=True):
                st.session_state.is_playing = False
                st.rerun()

    with ctrl_col4:
        if st.button("Next ▶", use_container_width=True, disabled=(st.session_state.current_step >= total_steps)):
            st.session_state.current_step += 1
            st.session_state.is_playing = False
            st.rerun()

    with ctrl_col5:
        if st.button("⏭ Last", use_container_width=True):
            st.session_state.current_step = total_steps
            st.session_state.is_playing = False
            st.rerun()

    with ctrl_col6:
        jump_step = st.slider(
            "Jump to Step",
            min_value=1,
            max_value=total_steps,
            value=st.session_state.current_step,
            key="jump_slider",
        )
        if jump_step != st.session_state.current_step:
            st.session_state.current_step = jump_step
            st.session_state.is_playing = False
            st.rerun()

    # Current Step Data
    step_data = current_algo_sim["steps"][st.session_state.current_step - 1]
    curr_req_page = step_data["page"]
    is_hit = step_data["result"] == "HIT"

    st.progress(st.session_state.current_step / total_steps)
    st.caption(f"Progress: Step {st.session_state.current_step} of {total_steps} references")

    st.write("")

    # Visual Display Card
    card_col1, card_col2, card_col3 = st.columns([1.5, 3.5, 2.0])

    with card_col1:
        st.markdown(
            f"""
            <div class="metric-card">
                <span style="font-size: 0.85rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Requested Page</span>
                <div style="font-size: 2.8rem; font-weight: 800; color: #0f294a; margin: 6px 0;">{curr_req_page}</div>
                <div>{"<span class='badge-hit'>PAGE HIT</span>" if is_hit else "<span class='badge-fault'>PAGE FAULT</span>"}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with card_col2:
        st.markdown("##### Physical Memory Frames State")
        frame_html = "<div style='display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;'>"
        for f_idx, val in enumerate(step_data["frames"], start=1):
            if val is None:
                frame_html += f"""
                <div class="frame-box frame-box-empty">
                    <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">Frame {f_idx}</div>
                    <div style="margin-top: 4px;">EMPTY</div>
                </div>
                """
            else:
                is_active = (val == curr_req_page)
                active_class = "frame-box-active" if is_active else ""
                highlight_sub = "Target" if is_active else "Resident"
                frame_html += f"""
                <div class="frame-box {active_class}">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Frame {f_idx}</div>
                    <div style="margin-top: 4px; font-size: 1.4rem;">{val}</div>
                    <div style="font-size: 0.7rem; color: {'#1d4ed8' if is_active else '#94a3b8'};">{highlight_sub}</div>
                </div>
                """
        frame_html += "</div>"
        st.markdown(frame_html, unsafe_allow_html=True)

    with card_col3:
        st.markdown(
            f"""
            <div class="metric-card">
                <span style="font-size: 0.85rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Eviction Status</span>
                <div style="font-size: 1.8rem; font-weight: 700; color: {'#b91c1c' if step_data['evicted'] is not None else '#047857'}; margin: 8px 0;">
                    {f"Page {step_data['evicted']}" if step_data['evicted'] is not None else "None"}
                </div>
                <div style="font-size: 0.85rem; color: #64748b;">
                    Cumulative Faults: <strong>{step_data['faults']}</strong> | Hits: <strong>{step_data['hits']}</strong>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown(
        f"""
        <div style="background-color: #ffffff; border-radius: 8px; padding: 14px 18px; border: 1px solid #e2e8f0; margin-top: 14px;">
            <strong style="color: #0f294a;">Step Decision Explanation:</strong>
            <span style="color: #334155;"> {step_data['explanation']}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Reference String Timeline with active highlight
    st.subheader("Reference Sequence Tracker")
    seq_html = "<div style='display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px;'>"
    for idx, p in enumerate(pages, start=1):
        if idx == st.session_state.current_step:
            style = "background-color: #2563eb; color: #ffffff; border: 2px solid #1d4ed8; font-weight: 800; transform: scale(1.15);"
        elif idx < st.session_state.current_step:
            style = "background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;"
        else:
            style = "background-color: #ffffff; color: #94a3b8; border: 1px dashed #cbd5e1;"
        seq_html += f"<div style='border-radius: 6px; padding: 6px 12px; font-size: 0.95rem; text-align: center; {style}'>{p}</div>"
    seq_html += "</div>"
    st.markdown(seq_html, unsafe_allow_html=True)

    # All Tasks Visual Matrix
    st.subheader("📋 Complete Memory Access Trace — All Tasks")
    st.caption("Side-by-side progression showing every single page reference task, memory frames, and replacement decision.")

    tasks_cols = st.columns(min(len(current_algo_sim["steps"]), 4))
    for t_idx, task_step in enumerate(current_algo_sim["steps"]):
        col_target = tasks_cols[t_idx % len(tasks_cols)]
        t_is_hit = task_step["result"] == "HIT"
        badge_style = "background-color: #dcfce7; color: #166534; border: 1px solid #86efac;" if t_is_hit else "background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;"
        card_border = "border: 2px solid #2563eb;" if task_step["step"] == st.session_state.current_step else "border: 1px solid #e2e8f0;"

        with col_target:
            st.markdown(
                f"""
                <div style="background-color: #ffffff; border-radius: 8px; padding: 12px; margin-bottom: 12px; {card_border} box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">Task #{task_step['step']}</span>
                        <span style="font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 9999px; {badge_style}">
                            {task_step['result']}
                        </span>
                    </div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #0f294a; margin-bottom: 6px;">
                        Page {task_step['page']}
                    </div>
                    <div style="font-size: 0.75rem; color: #64748b; font-family: monospace; background: #f8fafc; padding: 4px; border-radius: 4px; margin-bottom: 6px;">
                        Frames: {[f if f is not None else '-' for f in task_step['frames']]}
                    </div>
                    <div style="font-size: 0.7rem; color: {'#b91c1c' if task_step['evicted'] is not None else '#059669'}; font-weight: 600;">
                        {f"Evicted: Page {task_step['evicted']}" if task_step['evicted'] is not None else "No eviction"}
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    # Simulation History Table
    st.subheader("Full Simulation Audit Log")
    history_records = []
    for s in current_algo_sim["steps"]:
        history_records.append({
            "Step": s["step"],
            "Requested Page": s["page"],
            "Memory Frames": str([f if f is not None else "-" for f in s["frames"]]),
            "Result": s["result"],
            "Evicted Page": s["evicted"] if s["evicted"] is not None else "-",
            "Cumulative Faults": s["faults"],
            "Cumulative Hits": s["hits"],
            "Explanation": s["explanation"],
        })
    df_history = pd.DataFrame(history_records)
    st.dataframe(df_history, use_container_width=True, height=260)

    # Handle automated playback timer
    if st.session_state.is_playing:
        if st.session_state.current_step < total_steps:
            time.sleep(st.session_state.get("auto_speed", 0.8))
            st.session_state.current_step += 1
            st.rerun()
        else:
            st.session_state.is_playing = False
            st.rerun()


# =============================================================================
# TAB 2: COMPARISON
# =============================================================================
with tab_comp:
    st.header(f"Multi-Algorithm Performance Comparison ({frame_count} Frames)")
    st.caption("Benchmark FIFO, LRU, and Optimal side-by-side using identical reference string and memory capacity.")

    comp_data = compare_algorithms(pages, frame_count)
    res_dict = comp_data["results"]

    # Summary metric cards
    m_col1, m_col2, m_col3 = st.columns(3)
    for col, (algo_name, res) in zip([m_col1, m_col2, m_col3], res_dict.items()):
        is_winner = algo_name in comp_data["best_algorithms"]
        border_highlight = "border: 2px solid #16a34a;" if is_winner else "border: 1px solid #e2e8f0;"
        badge = "<span style='color: #16a34a; font-weight: 700; font-size: 0.85rem;'>🏆 Lowest Faults</span>" if is_winner else ""
        with col:
            st.markdown(
                f"""
                <div class="metric-card" style="{border_highlight}">
                    <h3 style="margin-bottom: 2px; color: #0f294a;">{algo_name}</h3>
                    {badge}
                    <div style="display: flex; justify-content: space-around; margin-top: 12px;">
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b;">Page Faults</div>
                            <div style="font-size: 1.8rem; font-weight: 800; color: #dc2626;">{res['faults']}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">({res['fault_percentage']}%)</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b;">Page Hits</div>
                            <div style="font-size: 1.8rem; font-weight: 800; color: #16a34a;">{res['hits']}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">({res['hit_percentage']}%)</div>
                        </div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.write("")

    # Comparison Table
    table_rows = []
    for algo_name, res in res_dict.items():
        table_rows.append({
            "Algorithm": algo_name,
            "Total References": res["total_references"],
            "Page Hits": res["hits"],
            "Page Faults": res["faults"],
            "Hit Ratio": res["hit_ratio"],
            "Fault Ratio": res["fault_ratio"],
            "Hit Percentage (%)": f"{res['hit_percentage']}%",
            "Fault Percentage (%)": f"{res['fault_percentage']}%",
        })
    df_comp = pd.DataFrame(table_rows)
    st.subheader("Statistical Summary Table")
    st.dataframe(df_comp, use_container_width=True)

    # Winner Banner
    if comp_data["is_tie"]:
        winners_str = " and ".join(comp_data["best_algorithms"])
        st.success(
            f"🤝 **Tie Detected:** {winners_str} tied for minimum page faults ({comp_data['min_faults']} faults)."
        )
    else:
        winner = comp_data["best_algorithms"][0]
        st.success(
            f"🏆 **Best Performing Policy:** {winner} achieved the fewest page faults ({comp_data['min_faults']} faults, {res_dict[winner]['fault_percentage']}%)."
        )

    st.write("")

    # Interactive Plotly Charts
    chart_col1, chart_col2 = st.columns(2)

    with chart_col1:
        st.subheader("Total Page Faults vs Hits")
        fig_bar = go.Figure(
            data=[
                go.Bar(
                    name="Page Faults",
                    x=list(res_dict.keys()),
                    y=[res["faults"] for res in res_dict.values()],
                    marker_color="#ef4444",
                    text=[f"{res['faults']}" for res in res_dict.values()],
                    textposition="auto",
                ),
                go.Bar(
                    name="Page Hits",
                    x=list(res_dict.keys()),
                    y=[res["hits"] for res in res_dict.values()],
                    marker_color="#22c55e",
                    text=[f"{res['hits']}" for res in res_dict.values()],
                    textposition="auto",
                ),
            ]
        )
        fig_bar.update_layout(
            barmode="group",
            height=360,
            margin=dict(l=20, r=20, t=30, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis_title="Algorithm",
            yaxis_title="Count",
            template="plotly_white",
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    with chart_col2:
        st.subheader("Cumulative Page Faults Over Time")
        traces = comp_data["cumulative_traces"]
        fig_line = go.Figure()
        colors = {"FIFO": "#f59e0b", "LRU": "#3b82f6", "Optimal": "#10b981"}
        for algo_name in ["FIFO", "LRU", "Optimal"]:
            fig_line.add_trace(
                go.Scatter(
                    x=traces["steps"],
                    y=traces[algo_name],
                    mode="lines+markers",
                    name=algo_name,
                    line=dict(color=colors[algo_name], width=3),
                    marker=dict(size=6),
                )
            )
        fig_line.update_layout(
            height=360,
            margin=dict(l=20, r=20, t=30, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis_title="Reference Step Index",
            yaxis_title="Cumulative Page Faults",
            template="plotly_white",
        )
        st.plotly_chart(fig_line, use_container_width=True)

    st.markdown(
        """
        > **Academic Note:** Algorithm performance is strictly dependent upon memory reference locality
        > and physical frame availability. While Optimal is mathematically guaranteed to generate the
        > theoretical minimum number of page faults for any given reference string, it requires complete
        > knowledge of future references (unachievable in general-purpose preemptive operating systems).
        """
    )


# =============================================================================
# TAB 3: FRAMES ANALYSIS
# =============================================================================
with tab_frames:
    st.header("Memory Capacity Scaling & Belady's Anomaly")
    st.caption("Evaluate how increasing physical RAM frame capacity from 1 to 10 affects each algorithm's fault frequency.")

    # Belady preset shortcut button
    belady_example_str = "1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5"
    if st.button("🧪 Load Belady's Anomaly Benchmark (1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5)"):
        st.session_state.ref_string_input = belady_example_str
        st.session_state.current_step = 1
        st.session_state.is_playing = False
        st.rerun()

    analysis_res = analyze_frames(pages, max_frames=10)

    # Anomaly Alert Box
    if analysis_res["has_belady_anomaly"]:
        for anom in analysis_res["belady_anomalies"]:
            st.warning(
                f"🚨 **Belady's Anomaly Detected in FIFO!** When frame capacity increased from **{anom['lower_frames']} frames to {anom['higher_frames']} frames**, "
                f"page faults increased from **{anom['faults_lower']} to {anom['faults_higher']}** (+{anom['difference']} faults). "
                f"This directly contradicts the intuitive assumption that more memory always reduces faults!"
            )
    else:
        st.info(
            "ℹ️ No Belady's anomaly detected in FIFO for the current reference string across frames 1 to 10. "
            "Click the benchmark button above to test the canonical string."
        )

    # Frame scaling Plotly Chart
    fig_frames = go.Figure()
    fig_frames.add_trace(
        go.Scatter(
            x=analysis_res["frame_range"],
            y=analysis_res["fifo_faults"],
            mode="lines+markers",
            name="FIFO",
            line=dict(color="#f59e0b", width=3),
            marker=dict(size=8),
        )
    )
    fig_frames.add_trace(
        go.Scatter(
            x=analysis_res["frame_range"],
            y=analysis_res["lru_faults"],
            mode="lines+markers",
            name="LRU (Stack Algorithm)",
            line=dict(color="#3b82f6", width=3),
            marker=dict(size=8),
        )
    )
    fig_frames.add_trace(
        go.Scatter(
            x=analysis_res["frame_range"],
            y=analysis_res["opt_faults"],
            mode="lines+markers",
            name="Optimal (Stack Algorithm)",
            line=dict(color="#10b981", width=3),
            marker=dict(size=8),
        )
    )
    fig_frames.update_layout(
        title="Page Faults as a Function of Memory Frames",
        xaxis=dict(title="Number of Memory Frames (Capacity)", dtick=1),
        yaxis=dict(title="Total Page Faults"),
        height=420,
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    st.plotly_chart(fig_frames, use_container_width=True)

    # Supporting Data Table
    st.subheader("Frame Scaling Performance Data")
    df_frames = pd.DataFrame(analysis_res["data"])
    df_frames.columns = [
        "Frames",
        "FIFO Faults",
        "FIFO Hits",
        "FIFO Hit Ratio",
        "LRU Faults",
        "LRU Hits",
        "LRU Hit Ratio",
        "OPT Faults",
        "OPT Hits",
        "OPT Hit Ratio",
    ]
    st.dataframe(df_frames, use_container_width=True)

    st.markdown(
        """
        ### Why Does Belady's Anomaly Occur?
        - **Stack Algorithms (LRU and Optimal):** In a stack algorithm, the set of pages in memory for $n$ frames is
          *always a strict subset* of the pages that would reside in memory for $n+1$ frames:
          $$M(n, t) \subseteq M(n+1, t)$$
          Because of this inclusion property, allocating more memory can **never** increase the number of page faults.
        - **Non-Stack Algorithms (FIFO):** FIFO lacks this subset inclusion property. Evicting the oldest loaded page
          can inadvertently dump a frequently needed page at critical moments, producing more faults even with higher memory.
        """
    )


# =============================================================================
# TAB 4: LEARN
# =============================================================================
with tab_learn:
    st.header("Operating Systems Virtual Memory Guide")
    st.caption("Theoretical concepts, mathematical formulas, and algorithmic trade-offs.")

    col_l1, col_l2 = st.columns(2)

    with col_l1:
        with st.expander("1. Virtual Memory & Paging", expanded=True):
            st.markdown(
                """
                - **Virtual Memory:** A memory management capability of the OS that maps virtual addresses used by an application
                  to physical addresses in computer memory (RAM).
                - **Pages:** Fixed-size logical blocks into which the process's address space is divided (typically 4 KB).
                - **Frames:** Fixed-size physical memory slots in RAM that store active pages.
                - **Page Fault:** An interrupt raised by hardware when a program accesses a page not currently mapped in RAM.
                  The OS must load the required page from disk into a frame.
                - **Page Hit:** When the requested page is already resident in physical RAM frames, allowing immediate zero-penalty CPU access.
                """
            )

        with st.expander("2. Mathematical Formulas", expanded=True):
            st.markdown(
                """
                $$\\text{Hit Ratio} = \\frac{\\text{Page Hits}}{\\text{Total Page References}}$$
                $$\\text{Fault Ratio} = \\frac{\\text{Page Faults}}{\\text{Total Page References}}$$
                $$\\text{Hit Percentage} = \\text{Hit Ratio} \\times 100\\%$$
                $$\\text{Fault Percentage} = \\text{Fault Ratio} \\times 100\\%$$
                $$\\text{Page Hits} + \\text{Page Faults} = \\text{Total References}$$
                """
            )

        with st.expander("3. Worked Step-by-Step Example (Standard Reference)", expanded=True):
            st.markdown(
                """
                **String:** `7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2` with **3 Frames**
                - **Step 1:** Req `7` -> Frame: `[7]` (Fault, cold start)
                - **Step 2:** Req `0` -> Frame: `[7, 0]` (Fault, cold start)
                - **Step 3:** Req `1` -> Frame: `[7, 0, 1]` (Fault, cold start)
                - **Step 4:** Req `2` -> Memory full!
                  - *FIFO* evicts `7` (oldest) -> `[2, 0, 1]`
                  - *LRU* evicts `7` (least recently used) -> `[2, 0, 1]`
                  - *Optimal* looks ahead (`0, 3, 0, 4, 2...`): `7` never reappears, evicts `7` -> `[2, 0, 1]`
                - **Step 5:** Req `0` -> Found in frame! (HIT for all)
                """
            )

    with col_l2:
        with st.expander("4. The Three Replacement Algorithms", expanded=True):
            st.markdown(
                """
                | Algorithm | Eviction Decision | Hardware Overhead | Stack Algorithm? |
                | :--- | :--- | :--- | :--- |
                | **FIFO** | Oldest loaded page | Low (simple FIFO queue) | ❌ No (Belady anomaly susceptible) |
                | **LRU** | Longest time without access | High (timestamps or register stack) | ✅ Yes (Immune to anomaly) |
                | **Optimal** | Longest time until next access | Impossible (requires future knowledge) | ✅ Yes (Theoretical lower bound) |
                """
            )

        with st.expander("5. Belady's Anomaly Explained", expanded=True):
            st.markdown(
                """
                In 1969, computer scientist **László Bélády** discovered that certain page replacement algorithms
                can experience an **increase in page faults when physical memory frames are added**.

                **Canonical Test Case:**
                `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`
                - With 3 Frames: **9 Page Faults**
                - With 4 Frames: **10 Page Faults** (Anomaly!)

                Algorithms like LRU and Optimal satisfy the **inclusion property** $M(n) \\subseteq M(n+1)$ and are mathematically immune.
                """
            )

        with st.expander("6. Real-World OS Implementations", expanded=True):
            st.markdown(
                """
                - Real operating systems (Linux, Windows, macOS) cannot use Optimal (future is unknown)
                  and rarely use pure LRU because maintaining hardware timestamps on every memory instruction is too expensive.
                - Instead, modern kernels use **approximations of LRU**, such as the **Clock (Second-Chance) algorithm**,
                  page-aging counters, and multi-generational LRU (MGLRU in recent Linux kernels).
                """
            )
