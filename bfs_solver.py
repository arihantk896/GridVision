"""
bfs_solver.py
=============
Backward / Forward Sweep (BFS) power-flow solver for radial distribution
networks.

Theory
------
For a branch k→m with impedance Z_km = R_km + jX_km:

  Backward sweep (leaf → root):
      I_km = (S_m / V_m)*          where S_m = P_m + jQ_m is the net injection
                                    at bus m (load – generation, conjugated).

  Forward sweep (root → leaf):
      V_m = V_k - I_km * Z_km

  Convergence criterion:
      max_bus |V^(iter+1) - V^(iter)| < ε   (ε = 1e-5 p.u. by default)

All quantities are in per-unit (p.u.) throughout the solver.

Author: Power-Systems Analytics Module
"""

import numpy as np
from typing import Dict, List, Optional, Tuple

from ieee33_data import BUS_DATA, BRANCH_DATA, BASE_KV, BASE_MVA, VSLACK


class BFSSolver:
    """
    Backward/Forward Sweep power-flow solver for radial (tree) distribution
    networks.

    Parameters
    ----------
    bus_data : list of [bus_id, P_kW, Q_kVAR]
        Per-bus load data.
    branch_data : list of [from_bus, to_bus, R_ohm, X_ohm]
        Branch impedance data in physical Ohms.
    base_kv : float
        Base line-to-line voltage in kV.
    base_mva : float
        Base apparent power in MVA.
    v_slack : float
        Slack-bus voltage magnitude in p.u. (default 1.0∠0°).
    tol : float
        Convergence tolerance on max voltage change (p.u.).
    max_iter : int
        Maximum number of BFS iterations.
    """

    def __init__(
        self,
        bus_data: List = None,
        branch_data: List = None,
        base_kv: float = BASE_KV,
        base_mva: float = BASE_MVA,
        v_slack: float = VSLACK,
        tol: float = 1e-5,
        max_iter: int = 100,
    ):
        self.base_kv   = base_kv
        self.base_mva  = base_mva
        self.v_slack   = complex(v_slack, 0.0)   # slack bus phasor
        self.tol       = tol
        self.max_iter  = max_iter

        # Use IEEE 33-bus defaults when no data is provided
        self._raw_bus    = bus_data    if bus_data    is not None else BUS_DATA
        self._raw_branch = branch_data if branch_data is not None else BRANCH_DATA

        # Per-unit base impedance: Z_base = (kV_base)^2 / MVA_base  (in Ohms)
        self.z_base = (base_kv ** 2) / base_mva  # Ohms

        # Per-unit base for current: I_base = MVA_base / (√3 · kV_base) (kA)
        self.i_base_ka = base_mva / (np.sqrt(3) * base_kv)

        # Distributed Generation injections: {bus_id: complex S_dg (p.u.)}
        self._dg: Dict[int, complex] = {}

        # Build internal data structures
        self._build_network()

    # ------------------------------------------------------------------
    # Network construction helpers
    # ------------------------------------------------------------------

    def _build_network(self):
        """Parse raw data into numpy arrays and build the branch tree."""

        # ---------- buses ----------
        bus_arr = np.array(self._raw_bus, dtype=float)
        n_bus   = len(bus_arr)

        self.bus_ids = bus_arr[:, 0].astype(int)          # 1-indexed IDs
        self._id2idx = {bid: i for i, bid in enumerate(self.bus_ids)}

        # Convert kW/kVAR → p.u. (divide by base_mva * 1000)
        base_kw = self.base_mva * 1e3
        self.S_load = (bus_arr[:, 1] + 1j * bus_arr[:, 2]) / base_kw  # p.u.

        # ---------- branches ----------
        br_arr = np.array(self._raw_branch, dtype=float)
        n_br   = len(br_arr)

        self.from_ids = br_arr[:, 0].astype(int)
        self.to_ids   = br_arr[:, 1].astype(int)

        # Impedance in p.u. (divide physical Ohms by Z_base)
        R_pu = br_arr[:, 2] / self.z_base
        X_pu = br_arr[:, 3] / self.z_base
        self.Z_pu = R_pu + 1j * X_pu     # complex impedance per branch (p.u.)

        # Map branch index → (from_idx, to_idx) in 0-based bus array
        self.from_idx = np.array([self._id2idx[b] for b in self.from_ids])
        self.to_idx   = np.array([self._id2idx[b] for b in self.to_ids])

        # Build ordered traversal list (BFS order from root=bus 1)
        self._bfs_order = self._build_bfs_order()

    def _build_bfs_order(self) -> List[int]:
        """
        Return branch indices in BFS (breadth-first) order starting from
        the slack bus.  This order is used in the forward sweep; the backward
        sweep uses the reversed order.
        """
        # Adjacency: parent → [child branch indices]
        children: Dict[int, List[int]] = {bid: [] for bid in self.bus_ids}
        for br_i, (f, t) in enumerate(zip(self.from_ids, self.to_ids)):
            children[f].append(br_i)

        order   = []
        queue   = [self.bus_ids[0]]          # start from slack bus
        visited = {self.bus_ids[0]}

        while queue:
            current = queue.pop(0)
            for br_i in children[current]:
                t = self.to_ids[br_i]
                if t not in visited:
                    order.append(br_i)
                    visited.add(t)
                    queue.append(t)

        return order

    # ------------------------------------------------------------------
    # DG management
    # ------------------------------------------------------------------

    def set_dg(self, bus_id: int, p_kw: float, q_kvar: float = 0.0):
        """
        Add or update a Distributed Generation (DG) injection at a bus.

        Parameters
        ----------
        bus_id : int
            Target bus (1-indexed).
        p_kw : float
            Active power injection in kW (positive = generation).
        q_kvar : float
            Reactive power injection in kVAR (positive = generation).
        """
        if bus_id not in self._id2idx:
            raise ValueError(f"Bus {bus_id} not found in network.")
        base_kw = self.base_mva * 1e3
        self._dg[bus_id] = (p_kw + 1j * q_kvar) / base_kw   # p.u.

    def clear_dg(self):
        """Remove all DG injections."""
        self._dg.clear()

    def _net_load(self) -> np.ndarray:
        """
        Return net complex load (load minus DG generation) at every bus in
        p.u. as a numpy array indexed by bus index (0-based).
        """
        S_net = self.S_load.copy()
        for bus_id, s_dg in self._dg.items():
            idx = self._id2idx[bus_id]
            S_net[idx] -= s_dg       # DG reduces net demand (or reverses it)
        return S_net

    # ------------------------------------------------------------------
    # BFS solver core
    # ------------------------------------------------------------------

    def solve(self) -> dict:
        """
        Run the Backward/Forward Sweep power-flow solution.

        Returns
        -------
        dict with keys:
            converged      : bool
            iterations     : int
            V              : np.ndarray  (complex p.u. bus voltages)
            I_branch       : np.ndarray  (complex p.u. branch currents)
            P_loss_branch  : np.ndarray  (p.u. active loss per branch)
            Q_loss_branch  : np.ndarray  (p.u. reactive loss per branch)
            P_loss_total   : float       (p.u. total active loss)
            Q_loss_total   : float       (p.u. total reactive loss)
        """
        n_bus = len(self.bus_ids)
        n_br  = len(self.Z_pu)

        # Initialise all bus voltages to slack voltage (flat start)
        V = np.ones(n_bus, dtype=complex) * self.v_slack

        S_net     = self._net_load()
        converged = False

        for iteration in range(1, self.max_iter + 1):

            V_prev = V.copy()

            # ── Backward sweep ───────────────────────────────────────────────
            # Traverse branches from leaf to root (reversed BFS order).
            # At each branch k→m, compute the branch current carrying all
            # downstream load:
            #
            #   I_km = (S_m_net / V_m)*          [conjugate of load phasor]
            #
            # In a multi-level tree each bus accumulates downstream currents;
            # we build it iteratively in reverse BFS order so children are
            # always processed before parents.
            # --------------------------------------------------------------------

            # Start: each bus current equals its own injected current
            I_bus = np.zeros(n_bus, dtype=complex)
            for idx in range(n_bus):
                if self.bus_ids[idx] == self.bus_ids[0]:   # skip slack
                    continue
                # I = (S / V)*  — conjugate of apparent power divided by voltage
                I_bus[idx] = np.conj(S_net[idx] / V[idx])

            # Propagate currents toward root (reverse BFS = leaf → root)
            I_branch = np.zeros(n_br, dtype=complex)
            for br_i in reversed(self._bfs_order):
                f_idx = self.from_idx[br_i]
                t_idx = self.to_idx[br_i]
                # Branch carries the 'to' bus injection plus all downstream
                I_branch[br_i] = I_bus[t_idx]
                # Pass upstream: add to 'from' bus so its parent will include it
                I_bus[f_idx] += I_bus[t_idx]

            # ── Forward sweep ────────────────────────────────────────────────
            # Traverse from root outward (BFS order).
            # Voltage drop across branch k→m:
            #
            #   V_m = V_k - I_km * Z_km
            # --------------------------------------------------------------------
            for br_i in self._bfs_order:
                f_idx = self.from_idx[br_i]
                t_idx = self.to_idx[br_i]
                V[t_idx] = V[f_idx] - I_branch[br_i] * self.Z_pu[br_i]

            # Slack bus voltage is always fixed
            V[0] = self.v_slack

            # ── Convergence check ────────────────────────────────────────────
            delta = np.max(np.abs(V - V_prev))
            if delta < self.tol:
                converged = True
                break

        # ── Post-processing ──────────────────────────────────────────────────
        # Branch losses: P_loss = |I|² · R,   Q_loss = |I|² · X
        I_sq          = np.abs(I_branch) ** 2
        P_loss_branch = I_sq * self.Z_pu.real
        Q_loss_branch = I_sq * self.Z_pu.imag

        return {
            "converged"     : converged,
            "iterations"    : iteration,
            "V"             : V,
            "I_branch"      : I_branch,
            "P_loss_branch" : P_loss_branch,
            "Q_loss_branch" : Q_loss_branch,
            "P_loss_total"  : float(P_loss_branch.sum()),
            "Q_loss_total"  : float(Q_loss_branch.sum()),
        }


# ---------------------------------------------------------------------------
# Convenience: derived physical quantities
# ---------------------------------------------------------------------------

def pu_to_kw(s_pu: float, base_mva: float = BASE_MVA) -> float:
    """Convert per-unit apparent / active power to kW."""
    return s_pu * base_mva * 1e3


def voltage_violations(
    V_pu: np.ndarray,
    bus_ids: np.ndarray,
    v_min: float = 0.95,
    v_max: float = 1.05,
) -> Tuple[List[int], List[int]]:
    """
    Return lists of bus IDs with under- and over-voltage violations.

    Parameters
    ----------
    V_pu    : complex p.u. voltages per bus.
    bus_ids : 1-indexed bus ID array aligned with V_pu.
    v_min   : lower voltage limit (p.u.).
    v_max   : upper voltage limit (p.u.).

    Returns
    -------
    (under_buses, over_buses) — lists of 1-indexed bus IDs.
    """
    Vmag = np.abs(V_pu)
    under = list(bus_ids[Vmag < v_min])
    over  = list(bus_ids[(Vmag > v_max) & (bus_ids != bus_ids[0])])  # skip slack
    return under, over

