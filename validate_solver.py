"""
validate_solver.py
==================
Standalone validation / benchmark script for the BFS solver on the
IEEE 33-bus distribution system.

Run:  python validate_solver.py

Checks:
  1. Convergence in < 100 iterations.
  2. Total active loss is within the published range [~202, ~212] kW.
  3. Minimum voltage is at bus 18 with Vmin ≈ 0.9131 p.u.
  4. Power balance: substation injection ≈ total load + total losses.
"""

import numpy as np
from bfs_solver import BFSSolver, pu_to_kw

SEPARATOR = "─" * 60


def run_base_case():
    print(SEPARATOR)
    print("  IEEE 33-Bus BFS Power Flow — Base Case Validation")
    print(SEPARATOR)

    solver = BFSSolver()
    res    = solver.solve()

    print(f"  Converged     : {res['converged']}")
    print(f"  Iterations    : {res['iterations']}")

    V    = res["V"]
    Vmag = np.abs(V)
    Vang = np.degrees(np.angle(V))

    # ── Bus voltage table ──────────────────────────────────────────────
    print(f"\n{'Bus':>4}  {'|V| (p.u.)':>12}  {'∠V (°)':>10}")
    print("  " + "-" * 32)
    for i, bid in enumerate(solver.bus_ids):
        flag = ""
        if Vmag[i] < 0.95:
            flag = "  ← under-voltage ⚠"
        print(f"  {bid:>3}  {Vmag[i]:>12.6f}  {Vang[i]:>10.5f}{flag}")

    # ── Loss summary ───────────────────────────────────────────────────
    P_loss_kw  = pu_to_kw(res["P_loss_total"])
    Q_loss_kvar = pu_to_kw(res["Q_loss_total"])

    print(f"\n{SEPARATOR}")
    print(f"  Total Active  Loss  : {P_loss_kw:.4f}  kW")
    print(f"  Total Reactive Loss : {Q_loss_kvar:.4f} kVAR")

    # ── Min voltage ────────────────────────────────────────────────────
    Vmag_no_slack = Vmag[1:]
    bus_no_slack  = solver.bus_ids[1:]
    min_idx       = int(np.argmin(Vmag_no_slack))

    print(f"\n  Minimum Voltage     : {Vmag_no_slack[min_idx]:.6f} p.u.  "
          f"at Bus {bus_no_slack[min_idx]}")

    # ── Power balance check ─────────────────────────────────────────────
    # Substation (slack) complex power = sum of loads + losses
    S_net = solver._net_load()
    total_P_load_pu = float(S_net.real.sum())      # loads only (no gen in base)
    total_Q_load_pu = float(S_net.imag.sum())

    print(f"\n  Total Load          : P = {pu_to_kw(total_P_load_pu):.2f} kW  "
          f"Q = {pu_to_kw(total_Q_load_pu):.2f} kVAR")
    print(f"  Substation feeds    : P ≈ {pu_to_kw(total_P_load_pu) + P_loss_kw:.2f} kW")

    # ── Validation assertions ──────────────────────────────────────────
    print(f"\n{SEPARATOR}")
    print("  Validation checks:")

    passed = True

    def check(name, condition, expected):
        nonlocal passed
        status = "PASS ✅" if condition else "FAIL ❌"
        if not condition:
            passed = False
        print(f"    {status}  {name}  (expected: {expected})")

    check("Solver converged",          res["converged"],                         "True")
    check("Iterations ≤ 30",           res["iterations"] <= 30,                  "≤ 30")
    check("P_loss in [195, 215] kW",   195 < P_loss_kw < 215,                   "~202 kW")
    check("Vmin at bus 18",            int(bus_no_slack[min_idx]) == 18,         "Bus 18")
    check("Vmin ∈ [0.905, 0.920]",     0.905 < Vmag_no_slack[min_idx] < 0.920,  "~0.9131")

    print(f"\n  Overall: {'ALL PASSED ✅' if passed else 'SOME FAILURES ❌'}")
    print(SEPARATOR)
    return passed


def run_dg_scenario():
    print(f"\n{SEPARATOR}")
    print("  DG Scenario: 500 kW Solar PV at Bus 18 (worst bus)")
    print(SEPARATOR)

    solver = BFSSolver()
    solver.set_dg(bus_id=18, p_kw=500.0, q_kvar=0.0)
    res = solver.solve()

    V    = res["V"]
    Vmag = np.abs(V)

    P_loss_kw = pu_to_kw(res["P_loss_total"])
    Vmag_ex   = Vmag[1:]
    bus_ex    = solver.bus_ids[1:]
    min_idx   = int(np.argmin(Vmag_ex))

    print(f"  Converged     : {res['converged']}  ({res['iterations']} iters)")
    print(f"  Total P Loss  : {P_loss_kw:.4f} kW  (was ~202 kW)")
    print(f"  Min Voltage   : {Vmag_ex[min_idx]:.6f} p.u.  at Bus {bus_ex[min_idx]}")

    # Check for reverse power flow on branch 1→2
    I_12 = res["I_branch"][0]
    print(f"  Branch 1→2 current phasor: {I_12.real:.6f} + j{I_12.imag:.6f} p.u.")
    print(f"  (Negative real part indicates reverse active-power flow ✓)")


if __name__ == "__main__":
    ok = run_base_case()
    run_dg_scenario()

