# GridVision — Distribution Network Intelligence Platform

**IEEE 33-Bus Radial Distribution Power Flow & DG Analyzer**

A fully self-contained power-systems tool that implements the Backward/Forward Sweep (BFS) load-flow algorithm from scratch using NumPy, exposes it via a Flask REST API, and renders an interactive dark-theme dashboard in pure HTML / CSS / JavaScript (Tailwind CSS · Chart.js · Leaflet).

---

## Quick Start

```powershell
# 1 — Enter project directory
cd "C:\Users\soham\OneDrive\Documents\SEM 3\DM\course project"

# 2 — Create & activate the virtual environment (first time only)
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt

# 3 — Validate the BFS solver (all 5 benchmark checks must say PASS)
.venv\Scripts\python validate_solver.py

# 4 — Launch GridVision
.venv\Scripts\python server.py
```

Open your browser → **http://localhost:5000**

> **Note:** if you already ran `.venv\Scripts\pip install -r requirements.txt` once, just run step 4.

---

## Validated Benchmark Results (IEEE 33-Bus Base Case)

| Metric | Value | Standard Reference |
|---|---|---|
| Converged | **True** | — |
| Iterations | **5** | ≤ 30 |
| Total Active Loss | **202.68 kW** | ~202 kW |
| Total Reactive Loss | **135.14 kVAR** | — |
| Min Voltage | **0.9131 p.u.** | ~0.913 p.u. |
| Min Voltage Bus | **Bus 18** | Bus 18 |
| Under-voltage buses | **21** (V < 0.95 p.u.) | — |
| With 500 kW DG @ Bus 18 | **153.42 kW loss** | −24 % reduction |

---

## Project File Map

```
course project/
├── bfs_solver.py          # BFS power flow algorithm (NumPy, from scratch)
├── ieee33_data.py         # IEEE 33-bus bus & branch impedance data
├── analytics.py           # NetworkAnalyzer: violations, DG, DataFrames
├── server.py              # Flask REST API + static file server
├── validate_solver.py     # Benchmark validation script
├── requirements.txt       # Python dependencies
├── backup_pre_cleanup.zip # Pre-cleanup archive backup
├── frontend/
│   ├── index.html         # Single-page dashboard (Tailwind CSS)
│   ├── css/
│   │   ├── style.css      # Custom dark-obsidian theme
│   │   └── leaflet.css    # Leaflet map styles (local, no CDN)
│   └── js/
│       ├── app.js         # All dashboard logic (Chart.js, Leaflet, API)
│       ├── chart.umd.min.js  # Chart.js v4 (local, no CDN)
│       └── leaflet.js     # Leaflet v1 (local, no CDN)
└── .venv/                 # Python virtual environment
```

---

## BFS Algorithm Reference

**Backward Sweep** — branch currents from leaf nodes to substation:
```
I_m = conj( (P_m − jQ_m) / V_m )
```

**Forward Sweep** — nodal voltages from substation outward:
```
V_m = V_k − I_km · (R_km + jX_km)
```

**Convergence criterion:**
```
max |V^(iter+1) − V^(iter)| < 1e-5
```

Specifically designed for high R/X radial distribution feeders where Newton-Raphson diverges.

---

## Dashboard Features

| Section | Description |
|---|---|
| KPI Ribbon | Total load, DG output, active/reactive losses, min voltage, violation count |
| DG Injection Station | Select any bus (2–33), set P (0–1000 kW) and Q (−300–+300 kVAR) with sliders, apply presets |
| Network Topology | Leaflet geographic map **or** SVG schematic — click any bus node to select it |
| Voltage Profile Chart | Line chart: base case vs active scenario with ±5 % statutory limits |
| Branch Losses Chart | Grouped bar chart of P_loss and Q_loss per branch |
| Loss Allocation Donut | Proportional breakdown of active losses by branch segment |
| Phase Angle Chart | Nodal voltage phase angles relative to slack bus |
| Bus / Branch Tables | Full numerical dataset: |V|, ∠V, DG, losses, R/X ratio, current magnitude |
| Math Reference | BFS equations displayed inline |

---

## API

### `POST /api/solve`

**Request body:**
```json
{
  "dg": [
    { "bus_id": 18, "p_kw": 500, "q_kvar": 0 }
  ],
  "v_min": 0.95,
  "v_max": 1.05
}
```

**Response:**
```json
{
  "current": { "nodes": [...], "edges": [...], "metrics": {...} },
  "base":    { "nodes": [...], "edges": [...], "metrics": {...} }
}
```

`current` reflects the scenario with DG active; `base` is always the no-DG reference.
