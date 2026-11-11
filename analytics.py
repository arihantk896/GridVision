"""
analytics.py
============
High-level analytics engine wrapping the BFS solver.

Provides:
  - NetworkAnalyzer class that manages the solver, derives physical
    quantities, and exposes a clean DataFrame-oriented API for the UI.
  - Voltage-profile, branch-loss, and violation summaries.
  - DG scenario helpers (add / remove / scale injections).
"""

import numpy as np
import pandas as pd
import networkx as nx
from typing import Dict, List, Optional, Tuple

from bfs_solver import BFSSolver, pu_to_kw, voltage_violations
from ieee33_data import BUS_DATA, BRANCH_DATA, BASE_KV, BASE_MVA


class NetworkAnalyzer:
    """
    Orchestrates the BFS solver, post-processes results, and exposes
    structured DataFrames for the Streamlit dashboard.

    Parameters
    ----------
    base_kv  : float  Base line-to-line voltage (kV).
    base_mva : float  Base apparent power (MVA).
    v_min    : float  Under-voltage limit (p.u.).
    v_max    : float  Over-voltage limit (p.u.).
    """

    def __init__(
        self,
        base_kv:  float = BASE_KV,
        base_mva: float = BASE_MVA,
        v_min:    float = 0.95,
        v_max:    float = 1.05,
    ):
        self.base_kv  = base_kv
        self.base_mva = base_mva
        self.v_min    = v_min
        self.v_max    = v_max

        # Instantiate solver with IEEE 33-bus defaults
        self.solver = BFSSolver(
            bus_data=BUS_DATA,
            branch_data=BRANCH_DATA,
            base_kv=base_kv,
            base_mva=base_mva,
        )

        # Active DG config: {bus_id: {p_kw, q_kvar, label}}
        self._dg_config: Dict[int, dict] = {}

        # Cached solution
        self._result: Optional[dict] = None
        self._run_base()    # solve once at startup (no DG)

    # ------------------------------------------------------------------
    # DG management
    # ------------------------------------------------------------------

    def add_dg(
        self,
        bus_id: int,
        p_kw:   float,
        q_kvar: float = 0.0,
        label:  str   = "Solar PV",
    ):
        """Add or update a DG injection.  Triggers a new solve."""
        self._dg_config[bus_id] = {"p_kw": p_kw, "q_kvar": q_kvar, "label": label}
        self._apply_dg_and_solve()

    def remove_dg(self, bus_id: int):
        """Remove a DG unit and re-solve."""
        self._dg_config.pop(bus_id, None)
        self._apply_dg_and_solve()

    def clear_all_dg(self):
        """Remove every DG unit and re-solve."""
        self._dg_config.clear()
        self._apply_dg_and_solve()

    def _apply_dg_and_solve(self):
        """Push current DG config to the solver and run."""
        self.solver.clear_dg()
        for bus_id, cfg in self._dg_config.items():
            self.solver.set_dg(bus_id, cfg["p_kw"], cfg["q_kvar"])
        self._result = self.solver.solve()

    def _run_base(self):
        """Solve the base case (no DG)."""
        self.solver.clear_dg()
        self._result = self.solver.solve()

    # ------------------------------------------------------------------
    # Public result accessors
    # ------------------------------------------------------------------

    @property
    def result(self) -> dict:
        """Raw BFS result dict."""
        if self._result is None:
            self._run_base()
        return self._result

    def bus_dataframe(self) -> pd.DataFrame:
        """
        Return a DataFrame with per-bus electrical quantities.

        Columns
        -------
        bus_id, P_load_kW, Q_load_kVAR,
        DG_P_kW, DG_Q_kVAR,
        V_pu, V_angle_deg, V_kV,
        violation  ('under' | 'over' | '')
        """
        res     = self.result
        V       = res["V"]
        Vmag    = np.abs(V)
        Vang    = np.degrees(np.angle(V))
        bus_ids = self.solver.bus_ids

        # Load data
        S_load_pu = self.solver.S_load
        P_load_kw  = S_load_pu.real * self.base_mva * 1e3
        Q_load_kvar = S_load_pu.imag * self.base_mva * 1e3

        # DG data per bus
        dg_p  = np.zeros(len(bus_ids))
        dg_q  = np.zeros(len(bus_ids))
        for bid, cfg in self._dg_config.items():
            idx = self.solver._id2idx[bid]
            dg_p[idx]  = cfg["p_kw"]
            dg_q[idx]  = cfg["q_kvar"]

        # Voltage in kV (line-to-neutral = base_kv / √3 · Vmag)
        V_kv = Vmag * (self.base_kv / np.sqrt(3))

        # Violation flags
        under, over = voltage_violations(V, bus_ids, self.v_min, self.v_max)
        violation   = []
        for bid in bus_ids:
            if bid in under:
                violation.append("under")
            elif bid in over:
                violation.append("over")
            else:
                violation.append("")

        return pd.DataFrame({
            "Bus ID"        : bus_ids,
            "P Load (kW)"   : P_load_kw.round(2),
            "Q Load (kVAR)" : Q_load_kvar.round(2),
            "DG P (kW)"     : dg_p.round(2),
            "DG Q (kVAR)"   : dg_q.round(2),
            "V (p.u.)"      : Vmag.round(6),
            "V Angle (°)"   : Vang.round(4),
            "V (kV)"        : V_kv.round(4),
            "Violation"     : violation,
        })

    def branch_dataframe(self) -> pd.DataFrame:
        """
        Return a DataFrame with per-branch electrical quantities.

        Columns
        -------
        branch_id, from_bus, to_bus,
        R_ohm, X_ohm, RX_ratio,
        |I| (p.u.), |I| (A),
        P_loss (kW), Q_loss (kVAR)
        """
        res      = self.result
        I_br     = res["I_branch"]
        P_loss   = res["P_loss_branch"]
        Q_loss   = res["Q_loss_branch"]
        Z        = self.solver.Z_pu

        # Physical R and X (back to Ohms)
        R_ohm = Z.real * self.solver.z_base
        X_ohm = Z.imag * self.solver.z_base
        RX    = np.where(X_ohm != 0, R_ohm / X_ohm, np.inf)

        # Physical current in Amperes
        I_base_A = (self.base_mva * 1e6) / (np.sqrt(3) * self.base_kv * 1e3)
        I_A      = np.abs(I_br) * I_base_A

        return pd.DataFrame({
            "Branch"       : np.arange(1, len(I_br) + 1),
            "From Bus"     : self.solver.from_ids,
            "To Bus"       : self.solver.to_ids,
            "R (Ω)"        : R_ohm.round(4),
            "X (Ω)"        : X_ohm.round(4),
            "R/X Ratio"    : RX.round(3),
            "|I| (p.u.)"   : np.abs(I_br).round(6),
            "|I| (A)"      : I_A.round(2),
            "P Loss (kW)"  : (P_loss * self.base_mva * 1e3).round(4),
            "Q Loss (kVAR)": (Q_loss * self.base_mva * 1e3).round(4),
        })

    def summary_metrics(self) -> dict:
        """
        Return high-level scalar summary metrics for the dashboard header.

        Keys
        ----
        total_load_kw, total_load_kvar,
        total_gen_kw, total_gen_kvar,
        total_ploss_kw, total_qloss_kvar,
        min_voltage_pu, min_voltage_bus,
        max_voltage_pu, max_voltage_bus,
        loss_pct,
        converged, iterations,
        n_under_violations, n_over_violations
        """
        res   = self.result
        V     = res["V"]
        Vmag  = np.abs(V)

        S_load = self.solver.S_load
        total_load_kw   = pu_to_kw(S_load.real.sum(), self.base_mva)
        total_load_kvar = pu_to_kw(S_load.imag.sum(), self.base_mva)

        total_gen_kw   = sum(c["p_kw"]  for c in self._dg_config.values())
        total_gen_kvar = sum(c["q_kvar"] for c in self._dg_config.values())

        P_loss_kw  = pu_to_kw(res["P_loss_total"], self.base_mva)
        Q_loss_kvar = pu_to_kw(res["Q_loss_total"], self.base_mva)

        # Exclude slack bus (index 0) from min/max search for under-voltage
        Vmag_ex_slack     = Vmag[1:]
        bus_ids_ex_slack  = self.solver.bus_ids[1:]

        min_v_idx  = int(np.argmin(Vmag_ex_slack))
        max_v_idx  = int(np.argmax(Vmag_ex_slack))

        under, over = voltage_violations(V, self.solver.bus_ids, self.v_min, self.v_max)

        loss_pct = (P_loss_kw / total_load_kw * 100) if total_load_kw > 0 else 0.0

        return {
            "total_load_kw"      : round(total_load_kw,   2),
            "total_load_kvar"    : round(total_load_kvar,  2),
            "total_gen_kw"       : round(total_gen_kw,     2),
            "total_gen_kvar"     : round(total_gen_kvar,   2),
            "total_ploss_kw"     : round(P_loss_kw,        4),
            "total_qloss_kvar"   : round(Q_loss_kvar,      4),
            "min_voltage_pu"     : round(float(Vmag_ex_slack[min_v_idx]), 6),
            "min_voltage_bus"    : int(bus_ids_ex_slack[min_v_idx]),
            "max_voltage_pu"     : round(float(Vmag_ex_slack[max_v_idx]), 6),
            "max_voltage_bus"    : int(bus_ids_ex_slack[max_v_idx]),
            "loss_pct"           : round(loss_pct, 3),
            "converged"          : res["converged"],
            "iterations"         : res["iterations"],
            "n_under_violations" : len(under),
            "n_over_violations"  : len(over),
        }

    # ------------------------------------------------------------------
    # NetworkX graph
    # ------------------------------------------------------------------

    def build_graph(self) -> nx.Graph:
        """
        Build a NetworkX graph of the distribution network.
        Nodes carry voltage magnitude and angle attributes.
        Edges carry branch loss and current attributes.
        """
        G   = nx.Graph()
        res = self.result
        V   = res["V"]
        Vmag = np.abs(V)
        Vang = np.degrees(np.angle(V))
        P_loss_br = res["P_loss_branch"] * self.base_mva * 1e3  # kW
        I_br      = np.abs(res["I_branch"])

        # Add nodes
        for i, bid in enumerate(self.solver.bus_ids):
            has_load   = (self.solver.S_load[i].real > 0) or (self.solver.S_load[i].imag > 0)
            has_dg     = bid in self._dg_config
            is_slack   = (i == 0)
            G.add_node(
                bid,
                vmag=float(Vmag[i]),
                vang=float(Vang[i]),
                p_load_kw=float(self.solver.S_load[i].real * self.base_mva * 1e3),
                has_dg=has_dg,
                is_slack=is_slack,
            )

        # Add edges
        for br_i in range(len(self.solver.from_ids)):
            f = int(self.solver.from_ids[br_i])
            t = int(self.solver.to_ids[br_i])
            G.add_edge(
                f, t,
                branch_idx=br_i,
                p_loss_kw=float(P_loss_br[br_i]),
                i_pu=float(I_br[br_i]),
                r_ohm=float(self.solver.Z_pu[br_i].real * self.solver.z_base),
                x_ohm=float(self.solver.Z_pu[br_i].imag * self.solver.z_base),
            )

        return G

    # ------------------------------------------------------------------
    # DG info accessor
    # ------------------------------------------------------------------

    def dg_summary(self) -> pd.DataFrame:
        """DataFrame of currently active DG units."""
        if not self._dg_config:
            return pd.DataFrame(columns=["Bus ID", "Label", "P (kW)", "Q (kVAR)"])
        rows = [
            {
                "Bus ID"  : bid,
                "Label"   : cfg["label"],
                "P (kW)"  : cfg["p_kw"],
                "Q (kVAR)": cfg["q_kvar"],
            }
            for bid, cfg in self._dg_config.items()
        ]
        return pd.DataFrame(rows)

