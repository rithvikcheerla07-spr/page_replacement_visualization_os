# Page Replacement Visualization System

A complete, interactive educational system and benchmark suite for virtual memory page replacement algorithms (**FIFO**, **LRU**, and **Optimal**), developed for the **B.Tech Operating Systems Course-Based Project (CBP)**.

---

## 1. Project Overview

In modern operating systems, physical memory (RAM) is limited. When a program demands more address space than physically available, the operating system uses **virtual memory** and **paging**. If the CPU requests a page not currently resident in RAM, a **page fault** occurs, requiring the OS to bring the missing page from secondary storage (disk) into a physical memory frame. When all physical frames are occupied, the OS must choose which resident page to evict.

This project provides an interactive simulation, comparative analytical dashboard, and automated test suite that demystifies how virtual memory management policies make eviction decisions.

### The Desk and Library Analogy
- **Physical Memory Frames (RAM):** A student working at a small desk that holds only a few open books at a time.
- **Secondary Storage (Hard Disk):** The university's massive library basement holding millions of volumes.
- **Page Hit:** The student needs a textbook that is already resting on their desk. Zero delay.
- **Page Fault:** The requested book is not on the desk. The student must pause their work, walk to the library shelves, bring the book to the desk, and—if the desk is completely covered—decide which book to return to make space.

---

## 2. Problem Statement & Objectives

Operating Systems textbooks teach page replacement conceptually through manual tables, which can make understanding subtle nuances—such as why FIFO does not alter queue order on a hit, why LRU requires hardware timestamps, or why Belady's Anomaly occurs—difficult to visualize.

### Objectives:
1. **Interactive Simulation:** Step forward, step backward, or auto-play through arbitrary page reference sequences while observing exact frame state changes.
2. **Deterministic Correctness:** Adhere to strict OS principles:
   - **FIFO (First In, First Out):** Evicts the oldest loaded page. Page hits do *not* alter queue order.
   - **LRU (Least Recently Used):** Evicts the page untouched for the longest time. Every hit updates recency.
   - **Optimal (OPT / Belady's Min):** Evicts the resident page whose next access occurs farthest in the future (or never again).
3. **Rigorous Benchmarking:** Run identical workloads across all algorithms, comparing hit/fault ratios, percentages, and cumulative fault trajectories.
4. **Capacity Scaling & Belady's Anomaly:** Analyze performance as frames scale from 1 to 10, highlighting why stack algorithms (LRU, Optimal) are immune to anomalies, while FIFO can suffer more faults with more memory.

---

## 3. Technology Stack

- **Language:** Python 3.10+ (tested on Python 3.10, 3.11, 3.12, 3.13)
- **User Interface:** Streamlit
- **Interactive Visualization:** Plotly Graph Objects
- **Data Manipulation:** Pandas
- **Testing Framework:** Pytest
- **Version Control:** Git & GitHub

---

## 4. Project Structure

```text
page-replacement-visualizer/
├── app.py                 # Streamlit multi-tab educational dashboard
├── algorithms.py          # Pure Python implementations of FIFO, LRU, and Optimal
├── requirements.txt       # Versioned dependencies
├── README.md              # Comprehensive documentation and guides
├── .gitignore             # Git exclusions for venv, caches, and OS artifacts
├── .python-version        # Recommended Python runtime version
├── run_windows.bat        # Double-click Windows launcher (venv setup + run)
├── run_tests.bat          # Automated test execution script
└── tests/
    └── test_algorithms.py # Pytest validation suite
```

---

## 5. Mathematical Formulas

- **Hit Ratio:**
  $$\text{Hit Ratio} = \frac{\text{Total Page Hits}}{\text{Total Page References}}$$
- **Fault Ratio:**
  $$\text{Fault Ratio} = \frac{\text{Total Page Faults}}{\text{Total Page References}}$$
- **Hit Percentage:**
  $$\text{Hit Percentage} = \text{Hit Ratio} \times 100\%$$
- **Fault Percentage:**
  $$\text{Fault Percentage} = \text{Fault Ratio} \times 100\%$$
- **Conservation Law:**
  $$\text{Total References} = \text{Page Hits} + \text{Page Faults}$$

---

## 6. Standard Textbook Benchmark & Expected Results

Using the canonical reference string with **3 physical frames**:
```
7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2
```
Total References: **13**

| Algorithm | Page Faults | Page Hits | Fault Ratio | Hit Ratio | Fault % | Hit % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **FIFO** | **10** | 3 | 0.7692 | 0.2308 | 76.92% | 23.08% |
| **LRU** | **9** | 4 | 0.6923 | 0.3077 | 69.23% | 30.77% |
| **Optimal** | **7** | 6 | 0.5385 | 0.4615 | 53.85% | 46.15% |

---

## 7. Windows Setup & VS Code Quickstart

### Method A: One-Click Windows Launcher (Recommended)
1. Double-click `run_windows.bat` in the project root.
2. The launcher automatically:
   - Verifies Python is installed on your system.
   - Creates a isolated `.venv` environment if missing.
   - Installs required packages from `requirements.txt`.
   - Starts Streamlit and opens your default browser at `http://localhost:8501`.

### Method B: Manual Command Line / VS Code Setup
Open **PowerShell** or **Command Prompt** in the project directory:

```powershell
# 1. Verify Python version (3.10 or newer)
python --version

# 2. Create the virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Windows Command Prompt:
.venv\Scripts\activate.bat

# 4. Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 5. Run the automated test suite
python -m pytest -v

# 6. Launch the dashboard
streamlit run app.py
```

### Visual Studio Code Setup
1. Launch VS Code: `code .`
2. Open the Command Palette (`Ctrl + Shift + P`).
3. Select **Python: Select Interpreter**.
4. Choose the interpreter inside `.venv` (`.\.venv\Scripts\python.exe`).
5. Open an integrated terminal (`Ctrl + \``) and run `streamlit run app.py`.

---

## 8. Running Automated Tests

To execute the test suite:
- **Windows Batch:** Double-click `run_tests.bat`.
- **Command Line:**
  ```powershell
  python -m pytest -v
  ```

### What the Test Suite Verifies:
1. Exact hit and fault counts for the textbook example (10, 9, 7).
2. FIFO insertion queue invariance (hits never alter eviction order).
3. LRU recency updates (hits always reset access timestamp).
4. Optimal future lookahead and infinity distance handling.
5. Invariant check: hits never trigger page evictions.
6. Invariant check: resident frames never exceed configured capacity.
7. Empty reference string and boundary inputs.
8. Belady's anomaly reproduction on canonical sequence `[1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]` (9 faults with 3 frames vs. 10 faults with 4 frames).

---

## 9. GitHub Version Control & Cloning

### Publishing to GitHub
```bash
# Initialize local repository
git init

# Stage all project files
git add .

# Create initial commit
git commit -m "Build Page Replacement Visualization System"

# Configure main branch
git branch -M main

# Link to your remote GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/page-replacement-visualizer.git

# Push to GitHub
git push -u origin main
```

### Cloning and Running on Another Computer
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/page-replacement-visualizer.git

# Navigate into project directory
cd page-replacement-visualizer

# Open in Visual Studio Code
code .

# Run via launcher
./run_windows.bat
```

---

## 10. Common Errors & Troubleshooting

| Issue / Error | Cause | Resolution |
| :--- | :--- | :--- |
| `'python' is not recognized as an internal or external command` | Python is not added to the Windows system `PATH`. | Re-run Python installer, select **Modify**, and check **"Add Python to PATH"**. |
| `Execution of scripts is disabled on this system` in PowerShell | Windows execution policy blocks `.venv\Scripts\Activate.ps1`. | Run PowerShell as Admin and execute `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use `cmd.exe` / `run_windows.bat`. |
| Port 8501 is already in use | Another instance of Streamlit is running. | Use `streamlit run app.py --server.port 8502` or terminate previous processes. |
| Missing C++ build tools during pandas install | Outdated pip trying to compile wheels. | Run `python -m pip install --upgrade pip` before installing requirements. |

---

## 11. Future Enhancements

- Support for **Clock (Second-Chance)** and **Enhanced Second-Chance** replacement policies.
- Working set model and page-fault frequency (PFF) allocation simulation.
- Trace file import (e.g., Valgrind / Pin memory access traces).
