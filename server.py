"""
server.py
=========
Flask REST API + static-file server for GridVision.
Replaces the Streamlit frontend with a pure HTML/CSS/JS dashboard.

Run:  python server.py
Open: http://localhost:5000
"""

from flask import Flask, jsonify, request, send_from_directory
import numpy as np
from bfs_solver import BFSSolver, voltage_violations
from ieee33_data import BUS_DATA, BRANCH_DATA, BASE_KV, BASE_MVA

app = Flask(__name__, static_folder='frontend', static_url_path='/static')

# ---------------------------------------------------------------------------
# Pre-computed SVG layout positions {bus_id: (x, y)}
#
# Main feeder  y = 130  x spacing = 55 px  starting at x = 50
# Lateral up   y =  35  (buses 23-25, from bus 3)
# Lateral down y = 240  (buses 19-22 from bus 2, buses 26-33 from bus 6)
# ---------------------------------------------------------------------------
BASE_LAT = 37.7749
BASE_LNG = -122.4194

_POS = {
    # Main feeder
    1:  (50,  130), 2:  (105, 130), 3:  (160, 130), 4:  (215, 130),
    5:  (270, 130), 6:  (325, 130), 7:  (380, 130), 8:  (435, 130),
    9:  (490, 130), 10: (545, 130), 11: (600, 130), 12: (655, 130),
    13: (710, 130), 14: (765, 130), 15: (820, 130), 16: (875, 130),
    17: (930, 130), 18: (985, 130),
    # Lateral above (from bus 3)
    23: (160, 35),  24: (215, 35),  25: (270, 35),
    # Lateral below (from bus 2)
    19: (105, 240), 20: (160, 240), 21: (215, 240), 22: (270, 240),
    # Lateral below (from bus 6)
    26: (325, 240), 27: (380, 240), 28: (435, 240), 29: (490, 240),
    30: (545, 240), 31: (600, 240), 32: (655, 240), 33: (710, 240),
}


def _serialize(dg_cfg: dict, v_min: float, v_max: float) -> dict:
    """Run BFS and return a fully JSON-serialisable result dict."""
    solver = BFSSolver()
    for bid, cfg in dg_cfg.items():
        solver.set_dg(bid, cfg['p_kw'], cfg.get('q_kvar', 0.0))

    res  = solver.solve()
    V    = res['V']
    Vmag = np.abs(V)
    Vang = np.degrees(np.angle(V))

    # ── Nodes ──────────────────────────────────────────────────────────────
    nodes = []
    for i, bus in enumerate(BUS_DATA):
        bid  = int(bus[0])
        vmag = float(Vmag[i])
        if   i == 0:          viol = 'slack'
        elif vmag < v_min:    viol = 'under'
        elif vmag > v_max:    viol = 'over'
        else:                 viol = 'ok'
        x, y = _POS.get(bid, (0, 0))
        lat = round(BASE_LAT - (y - 130) * 0.00032, 6)
        lng = round(BASE_LNG + (x - 50) * 0.00052, 6)
        v_kv = round(vmag * (BASE_KV / np.sqrt(3)), 4)
        nodes.append({
            'id': bid, 'x': x, 'y': y,
            'lat': lat, 'lng': lng,
            'vmag': round(vmag, 6),
            'vang': round(float(Vang[i]), 4),
            'v_kv': v_kv,
            'p_load_kw':   float(bus[1]),
            'q_load_kvar': float(bus[2]),
            'dg_p_kw':   float(dg_cfg.get(bid, {}).get('p_kw',   0)),
            'dg_q_kvar': float(dg_cfg.get(bid, {}).get('q_kvar', 0)),
            'has_dg':   bid in dg_cfg,
            'is_slack': i == 0,
            'violation': viol,
        })

    # ── Edges ──────────────────────────────────────────────────────────────
    P_br = (res['P_loss_branch'] * BASE_MVA * 1e3).tolist()
    Q_br = (res['Q_loss_branch'] * BASE_MVA * 1e3).tolist()
    I_br = np.abs(res['I_branch']).tolist()
    edges = []
    for i, br in enumerate(BRANCH_DATA):
        r, x = float(br[2]), float(br[3])
        edges.append({
            'from': int(br[0]), 'to': int(br[1]),
            'r_ohm': r, 'x_ohm': x,
            'rx_ratio':    round(r / x, 3) if x else 999,
            'p_loss_kw':   round(P_br[i], 4),
            'q_loss_kvar': round(Q_br[i], 4),
            'i_pu':        round(I_br[i], 6),
        })

    # ── Summary metrics ────────────────────────────────────────────────────
    raw_P = sum(b[1] for b in BUS_DATA)
    raw_Q = sum(b[2] for b in BUS_DATA)
    Ploss = float(res['P_loss_total'] * BASE_MVA * 1e3)
    Qloss = float(res['Q_loss_total'] * BASE_MVA * 1e3)

    Vmag_ex = Vmag[1:]
    ids_ex  = [int(b[0]) for b in BUS_DATA[1:]]
    min_i   = int(np.argmin(Vmag_ex))
    max_i   = int(np.argmax(Vmag_ex))
    under   = [ids_ex[j] for j, v in enumerate(Vmag_ex.tolist()) if v < v_min]
    over    = [ids_ex[j] for j, v in enumerate(Vmag_ex.tolist()) if v > v_max]

    metrics = {
        'total_load_kw':   raw_P,
        'total_load_kvar': raw_Q,
        'total_gen_kw':    round(sum(c['p_kw'] for c in dg_cfg.values()), 2),
        'total_gen_kvar':  round(sum(c.get('q_kvar', 0) for c in dg_cfg.values()), 2),
        'total_ploss_kw':  round(Ploss, 4),
        'total_qloss_kvar':round(Qloss, 4),
        'loss_pct':        round(Ploss / raw_P * 100, 3),
        'min_voltage_pu':  round(float(Vmag_ex[min_i]), 6),
        'min_voltage_bus': ids_ex[min_i],
        'max_voltage_pu':  round(float(Vmag_ex[max_i]), 6),
        'max_voltage_bus': ids_ex[max_i],
        'converged':    bool(res['converged']),
        'iterations':   int(res['iterations']),
        'n_under':      len(under),
        'n_over':       len(over),
        'under_buses':  under,
        'over_buses':   over,
    }

    return {'nodes': nodes, 'edges': edges, 'metrics': metrics}


# ── Routes ─────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')


@app.route('/api/solve', methods=['POST'])
def solve():
    data   = request.get_json(force=True, silent=True) or {}
    dg_list = data.get('dg', [])
    v_min  = float(data.get('v_min', 0.95))
    v_max  = float(data.get('v_max', 1.05))

    dg_cfg = {}
    for item in dg_list:
        bid    = int(item['bus_id'])
        p_kw   = float(item.get('p_kw',   0))
        q_kvar = float(item.get('q_kvar', 0))
        if p_kw or q_kvar:
            dg_cfg[bid] = {'p_kw': p_kw, 'q_kvar': q_kvar}

    return jsonify({
        'current': _serialize(dg_cfg, v_min, v_max),
        'base':    _serialize({},     v_min, v_max),
    })


if __name__ == '__main__':
    print("\n  GridVision — Distribution Network Intelligence Platform")
    print("  Server running at: http://localhost:5000\n")
    app.run(debug=False, port=5000, host='0.0.0.0')

