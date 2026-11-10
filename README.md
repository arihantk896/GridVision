# GridVision — Distribution Network Intelligence Platform

### IEEE 33-Bus Radial Distribution Power Flow & DG Analyzer

GridVision is a power-system analysis tool that implements the **Backward/Forward Sweep (BFS) load-flow algorithm** using NumPy. It provides a Flask REST API and an interactive dark-themed dashboard built with HTML, CSS, JavaScript, Tailwind CSS, Chart.js, and Leaflet.

## Quick Start

### 1. Clone or download the repository

```powershell
cd "course project"
```

### 2. Create and activate a virtual environment

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install dependencies

```powershell
pip install -r requirements.txt
```

### 4. Validate the BFS solver

```powershell
python validate_solver.py
```

### 5. Launch GridVision

```powershell
python server.py
```

Open your browser and visit:

**http://localhost:5000**

## Validated Benchmark Results

### IEEE 33-Bus Base Case

| Metric | Result |
|---|---:|
| Convergence | True |
| Iterations | 5 |
| Active Power Loss | 202.68 kW |
| Reactive Power Loss | 135.14 kVAR |
| Minimum Voltage | 0.9131 p.u. |
| Minimum Voltage Bus | Bus 18 |
| Under-voltage Buses | 21 |

### DG Simulation

| Configuration | Active Power Loss |
|---|---:|
| Base Case | 202.68 kW |
| 500 kW DG at Bus 18 | 153.42 kW |

**Reported loss reduction: approximately 24%.**

## Project Structure

```text
course-project/
├── bfs_solver.py          # Backward/Forward Sweep algorithm
├── ieee33_data.py         # IEEE 33-Bus network data
├── analytics.py           # Network analysis and DG management
├── server.py              # Flask REST API
├── validate_solver.py     # Solver validation
├── requirements.txt       # Python dependencies
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   └── leaflet.css
│   └── js/
│       ├── app.js
│       ├── chart.umd.min.js
│       └── leaflet.js
└── README.md
```

## BFS Algorithm

**1. Backward Sweep:** Calculates branch currents from leaf nodes towards the substation.

\[
I_m = \operatorname{conj}\left(\frac{P_m-jQ_m}{V_m}\right)
\]

**2. Forward Sweep:** Calculates bus voltages from the substation towards the leaf nodes.

\[
V_m = V_k-I_{km}(R_{km}+jX_{km})
\]

**3. Convergence Criterion:**

\[
\max |V^{(iter+1)}-V^{(iter)}| < 10^{-5}
\]

The algorithm iteratively updates current and voltage values until the convergence condition is satisfied.

## Dashboard Features

| Feature | Description |
|---|---|
| KPI Dashboard | Load, DG output, power losses and voltage violations |
| DG Injection | Configure DG power at buses 2–33 |
| Network Topology | Interactive network visualization |
| Voltage Profile | Compare base and DG scenario voltage profiles |
| Branch Losses | Visualize active and reactive losses |
| Loss Allocation | Branch-wise active loss distribution |
| Phase Angle | Display bus voltage phase angles |
| Bus & Branch Tables | Detailed electrical parameters |
| Math Reference | Important BFS equations |

## REST API

### `POST /api/solve`

**Request:**

```json
{
  "dg": [
    {
      "bus_id": 18,
      "p_kw": 500,
      "q_kvar": 0
    }
  ],
  "v_min": 0.95,
  "v_max": 1.05
}
```

**Response Structure:**

```json
{
  "current": {
    "nodes": [],
    "edges": [],
    "metrics": {}
  },
  "base": {
    "nodes": [],
    "edges": [],
    "metrics": {}
  }
}
```

- `current`: Results for the active DG scenario.
- `base`: Reference results without DG injection.

## Technologies Used

- **Backend:** Python, Flask, NumPy
- **Frontend:** HTML, CSS, JavaScript, Tailwind CSS
- **Visualization:** Chart.js, Leaflet
- **Network Analysis:** Graph Theory and NetworkX

## Discrete Mathematics Concepts

This project demonstrates practical applications of:

- Graph Theory
- Trees and Rooted Trees
- Breadth-First Search (BFS)
- Tree Traversal
- Paths and Connectivity
- Relations
- Sequences and Convergence
- Complex Numbers
- Set Partitioning and Logic

## Project Objective

GridVision demonstrates how mathematical concepts and computational algorithms can be applied to real-world electrical distribution networks. It provides an interactive environment to analyse voltage stability, identify power losses, and study the impact of Distributed Generation.

---

**GridVision — Connecting Discrete Mathematics with Real-World Power System Analysis.**
