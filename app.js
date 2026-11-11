/**
 * GridVision — Distribution Network Intelligence Platform
 * Frontend Application Controller
 * Handles Leaflet spatial network map, SVG schematic layout, Chart.js analytics,
 * high-contrast visualizer, and asynchronous BFS power-flow solver synchronization.
 */

// Initial Seed Dataset for IEEE 33-Bus Base Benchmark (Instant Render)
const DEFAULT_SYSTEM_DATA = {
  metrics: {
    total_load_kw: 3715.0,
    total_load_kvar: 2300.0,
    total_gen_kw: 0.0,
    total_gen_kvar: 0.0,
    total_ploss_kw: 202.6762,
    total_qloss_kvar: 135.1403,
    loss_pct: 5.456,
    min_voltage_pu: 0.913091,
    min_voltage_bus: 18,
    max_voltage_pu: 0.997032,
    max_voltage_bus: 2,
    converged: true,
    iterations: 5,
    n_under: 21,
    n_over: 0,
    under_buses: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33],
    over_buses: [],
  },
  nodes: [
    { id: 1,  x: 50,  y: 130, lat: 37.774900, lng: -122.419400, vmag: 1.000000, vang:  0.0000, v_kv: 7.3093, p_load_kw:   0.0, q_load_kvar:   0.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: true,  violation: 'slack' },
    { id: 2,  x: 105, y: 130, lat: 37.774900, lng: -122.418880, vmag: 0.997032, vang:  0.0145, v_kv: 7.2876, p_load_kw: 100.0, q_load_kvar:  60.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 3,  x: 160, y: 130, lat: 37.774900, lng: -122.418360, vmag: 0.982938, vang:  0.0960, v_kv: 7.1846, p_load_kw:  90.0, q_load_kvar:  40.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 4,  x: 215, y: 130, lat: 37.774900, lng: -122.417840, vmag: 0.975456, vang:  0.1616, v_kv: 7.1299, p_load_kw: 120.0, q_load_kvar:  80.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 5,  x: 270, y: 130, lat: 37.774900, lng: -122.417320, vmag: 0.968059, vang:  0.2283, v_kv: 7.0759, p_load_kw:  60.0, q_load_kvar:  30.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 6,  x: 325, y: 130, lat: 37.774900, lng: -122.416800, vmag: 0.949658, vang:  0.1339, v_kv: 6.9414, p_load_kw:  60.0, q_load_kvar:  20.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 7,  x: 380, y: 130, lat: 37.774900, lng: -122.416280, vmag: 0.946173, vang: -0.0965, v_kv: 6.9159, p_load_kw: 200.0, q_load_kvar: 100.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 8,  x: 435, y: 130, lat: 37.774900, lng: -122.415760, vmag: 0.941329, vang: -0.0604, v_kv: 6.8805, p_load_kw: 200.0, q_load_kvar: 100.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 9,  x: 490, y: 130, lat: 37.774900, lng: -122.415240, vmag: 0.935060, vang: -0.1335, v_kv: 6.8347, p_load_kw:  60.0, q_load_kvar:  20.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 10, x: 545, y: 130, lat: 37.774900, lng: -122.414720, vmag: 0.929245, vang: -0.1960, v_kv: 6.7922, p_load_kw:  60.0, q_load_kvar:  20.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 11, x: 600, y: 130, lat: 37.774900, lng: -122.414200, vmag: 0.928385, vang: -0.1888, v_kv: 6.7859, p_load_kw:  45.0, q_load_kvar:  30.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 12, x: 655, y: 130, lat: 37.774900, lng: -122.413680, vmag: 0.926885, vang: -0.1773, v_kv: 6.7750, p_load_kw:  60.0, q_load_kvar:  35.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 13, x: 710, y: 130, lat: 37.774900, lng: -122.413160, vmag: 0.920772, vang: -0.2686, v_kv: 6.7303, p_load_kw:  60.0, q_load_kvar:  35.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 14, x: 765, y: 130, lat: 37.774900, lng: -122.412640, vmag: 0.918505, vang: -0.3473, v_kv: 6.7137, p_load_kw: 120.0, q_load_kvar:  80.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 15, x: 820, y: 130, lat: 37.774900, lng: -122.412120, vmag: 0.917093, vang: -0.3850, v_kv: 6.7034, p_load_kw:  60.0, q_load_kvar:  10.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 16, x: 875, y: 130, lat: 37.774900, lng: -122.411600, vmag: 0.915725, vang: -0.4082, v_kv: 6.6934, p_load_kw:  60.0, q_load_kvar:  20.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 17, x: 930, y: 130, lat: 37.774900, lng: -122.411080, vmag: 0.913698, vang: -0.4855, v_kv: 6.6786, p_load_kw:  60.0, q_load_kvar:  20.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 18, x: 985, y: 130, lat: 37.774900, lng: -122.410560, vmag: 0.913091, vang: -0.4951, v_kv: 6.6741, p_load_kw:  90.0, q_load_kvar:  40.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 19, x: 105, y: 240, lat: 37.739700, lng: -122.418880, vmag: 0.996504, vang:  0.0036, v_kv: 7.2838, p_load_kw:  90.0, q_load_kvar:  40.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 20, x: 160, y: 240, lat: 37.739700, lng: -122.418360, vmag: 0.992926, vang: -0.0633, v_kv: 7.2576, p_load_kw:  90.0, q_load_kvar:  40.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 21, x: 215, y: 240, lat: 37.739700, lng: -122.417840, vmag: 0.992222, vang: -0.0827, v_kv: 7.2525, p_load_kw:  90.0, q_load_kvar:  40.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 22, x: 270, y: 240, lat: 37.739700, lng: -122.417320, vmag: 0.991584, vang: -0.1030, v_kv: 7.2478, p_load_kw:  90.0, q_load_kvar:  40.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 23, x: 160, y:  35, lat: 37.805300, lng: -122.418360, vmag: 0.979352, vang:  0.0651, v_kv: 7.1584, p_load_kw:  90.0, q_load_kvar:  50.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 24, x: 215, y:  35, lat: 37.805300, lng: -122.417840, vmag: 0.972681, vang: -0.0236, v_kv: 7.1096, p_load_kw: 420.0, q_load_kvar: 200.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 25, x: 270, y:  35, lat: 37.805300, lng: -122.417320, vmag: 0.969356, vang: -0.0674, v_kv: 7.0853, p_load_kw: 420.0, q_load_kvar: 200.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'ok' },
    { id: 26, x: 325, y: 240, lat: 37.739700, lng: -122.416800, vmag: 0.947729, vang:  0.1733, v_kv: 6.9273, p_load_kw:  60.0, q_load_kvar:  25.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 27, x: 380, y: 240, lat: 37.739700, lng: -122.416280, vmag: 0.945165, vang:  0.2295, v_kv: 6.9085, p_load_kw:  60.0, q_load_kvar:  25.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 28, x: 435, y: 240, lat: 37.739700, lng: -122.415760, vmag: 0.933726, vang:  0.3124, v_kv: 6.8249, p_load_kw:  60.0, q_load_kvar:  20.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 29, x: 490, y: 240, lat: 37.739700, lng: -122.415240, vmag: 0.925508, vang:  0.3903, v_kv: 6.7649, p_load_kw: 120.0, q_load_kvar:  70.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 30, x: 545, y: 240, lat: 37.739700, lng: -122.414720, vmag: 0.921950, vang:  0.4956, v_kv: 6.7389, p_load_kw: 200.0, q_load_kvar: 600.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 31, x: 600, y: 240, lat: 37.739700, lng: -122.414200, vmag: 0.917789, vang:  0.4112, v_kv: 6.7085, p_load_kw: 150.0, q_load_kvar:  70.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 32, x: 655, y: 240, lat: 37.739700, lng: -122.413680, vmag: 0.916874, vang:  0.3881, v_kv: 6.7018, p_load_kw: 210.0, q_load_kvar: 100.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' },
    { id: 33, x: 710, y: 240, lat: 37.739700, lng: -122.413160, vmag: 0.916590, vang:  0.3804, v_kv: 6.6997, p_load_kw:  60.0, q_load_kvar:  40.0, dg_p_kw: 0, dg_q_kvar: 0, has_dg: false, is_slack: false, violation: 'under' }
  ],
  edges: [
    { from: 1, to: 2, r_ohm: 0.0922, x_ohm: 0.0470, rx_ratio: 1.962, p_loss_kw: 12.1932, q_loss_kvar: 6.2166, i_pu: 0.3812 },
    { from: 2, to: 3, r_ohm: 0.4930, x_ohm: 0.2511, rx_ratio: 1.963, p_loss_kw: 51.3541, q_loss_kvar: 26.152, i_pu: 0.3341 },
    { from: 3, to: 4, r_ohm: 0.3660, x_ohm: 0.1864, rx_ratio: 1.963, p_loss_kw: 19.8214, q_loss_kvar: 10.096, i_pu: 0.2405 },
    { from: 4, to: 5, r_ohm: 0.3811, x_ohm: 0.1941, rx_ratio: 1.963, p_loss_kw: 18.6432, q_loss_kvar: 9.4952, i_pu: 0.2291 },
    { from: 5, to: 6, r_ohm: 0.8190, x_ohm: 0.7070, rx_ratio: 1.158, p_loss_kw: 38.2511, q_loss_kvar: 33.018, i_pu: 0.2241 },
    { from: 6, to: 7, r_ohm: 0.1872, x_ohm: 0.6188, rx_ratio: 0.303, p_loss_kw: 2.1451,  q_loss_kvar: 7.0912, i_pu: 0.1112 },
    { from: 7, to: 8, r_ohm: 0.7114, x_ohm: 0.2351, rx_ratio: 3.026, p_loss_kw: 6.8122,  q_loss_kvar: 2.2511, i_pu: 0.1011 },
    { from: 8, to: 9, r_ohm: 1.0300, x_ohm: 0.7400, rx_ratio: 1.392, p_loss_kw: 4.3121,  q_loss_kvar: 3.0981, i_pu: 0.0671 },
    { from: 9, to: 10, r_ohm: 1.0440, x_ohm: 0.7400, rx_ratio: 1.411, p_loss_kw: 3.6541, q_loss_kvar: 2.5891, i_pu: 0.0612 },
    { from: 10, to: 11, r_ohm: 0.1966, x_ohm: 0.0650, rx_ratio: 3.025, p_loss_kw: 0.5812, q_loss_kvar: 0.1921, i_pu: 0.0561 },
    { from: 11, to: 12, r_ohm: 0.3744, x_ohm: 0.1238, rx_ratio: 3.024, p_loss_kw: 0.9121, q_loss_kvar: 0.3012, i_pu: 0.0510 },
    { from: 12, to: 13, r_ohm: 1.4680, x_ohm: 1.1550, rx_ratio: 1.271, p_loss_kw: 2.7812, q_loss_kvar: 2.1891, i_pu: 0.0451 },
    { from: 13, to: 14, r_ohm: 0.5416, x_ohm: 0.7129, rx_ratio: 0.760, p_loss_kw: 0.7511, q_loss_kvar: 0.9881, i_pu: 0.0381 },
    { from: 14, to: 15, r_ohm: 0.5910, x_ohm: 0.5260, rx_ratio: 1.124, p_loss_kw: 0.4612, q_loss_kvar: 0.4101, i_pu: 0.0289 },
    { from: 15, to: 16, r_ohm: 0.7463, x_ohm: 0.5450, rx_ratio: 1.369, p_loss_kw: 0.4121, q_loss_kvar: 0.3012, i_pu: 0.0242 },
    { from: 16, to: 17, r_ohm: 1.2890, x_ohm: 1.7210, rx_ratio: 0.749, p_loss_kw: 0.5312, q_loss_kvar: 0.7091, i_pu: 0.0211 },
    { from: 17, to: 18, r_ohm: 0.7320, x_ohm: 0.5740, rx_ratio: 1.275, p_loss_kw: 0.1712, q_loss_kvar: 0.1341, i_pu: 0.0158 },
    { from: 2, to: 19, r_ohm: 0.1640, x_ohm: 0.1565, rx_ratio: 1.048, p_loss_kw: 1.5912, q_loss_kvar: 1.5181, i_pu: 0.1021 },
    { from: 19, to: 20, r_ohm: 1.5042, x_ohm: 1.3554, rx_ratio: 1.110, p_loss_kw: 8.3512, q_loss_kvar: 7.5251, i_pu: 0.0769 },
    { from: 20, to: 21, r_ohm: 0.4095, x_ohm: 0.4784, rx_ratio: 0.856, p_loss_kw: 0.9121, q_loss_kvar: 1.0651, i_pu: 0.0489 },
    { from: 21, to: 22, r_ohm: 0.7089, x_ohm: 0.9373, rx_ratio: 0.756, p_loss_kw: 0.4712, q_loss_kvar: 0.6231, i_pu: 0.0267 },
    { from: 3, to: 23, r_ohm: 0.4512, x_ohm: 0.3083, rx_ratio: 1.463, p_loss_kw: 3.1912, q_loss_kvar: 2.1812, i_pu: 0.0871 },
    { from: 23, to: 24, r_ohm: 0.8980, x_ohm: 0.7091, rx_ratio: 1.266, p_loss_kw: 5.3411, q_loss_kvar: 4.2181, i_pu: 0.0801 },
    { from: 24, to: 25, r_ohm: 0.8960, x_ohm: 0.7011, rx_ratio: 1.278, p_loss_kw: 1.3121, q_loss_kvar: 1.0261, i_pu: 0.0398 },
    { from: 6, to: 26, r_ohm: 0.2030, x_ohm: 0.1034, rx_ratio: 1.963, p_loss_kw: 2.5912, q_loss_kvar: 1.3201, i_pu: 0.1171 },
    { from: 26, to: 27, r_ohm: 0.2842, x_ohm: 0.1447, rx_ratio: 1.964, p_loss_kw: 3.3211, q_loss_kvar: 1.6921, i_pu: 0.1121 },
    { from: 27, to: 28, r_ohm: 1.0590, x_ohm: 0.9337, rx_ratio: 1.134, p_loss_kw: 11.231, q_loss_kvar: 9.9011, i_pu: 0.1072 },
    { from: 28, to: 29, r_ohm: 0.8042, x_ohm: 0.7006, rx_ratio: 1.148, p_loss_kw: 7.9121, q_loss_kvar: 6.8921, i_pu: 0.1031 },
    { from: 29, to: 30, r_ohm: 0.5075, x_ohm: 0.2585, rx_ratio: 1.963, p_loss_kw: 4.1211, q_loss_kvar: 2.0991, i_pu: 0.0932 },
    { from: 30, to: 31, r_ohm: 0.9744, x_ohm: 0.9630, rx_ratio: 1.012, p_loss_kw: 1.7612, q_loss_kvar: 1.7412, i_pu: 0.0441 },
    { from: 31, to: 32, r_ohm: 0.3105, x_ohm: 0.3619, rx_ratio: 0.858, p_loss_kw: 0.2312, q_loss_kvar: 0.2691, i_pu: 0.0281 },
    { from: 32, to: 33, r_ohm: 0.3410, x_ohm: 0.5302, rx_ratio: 0.643, p_loss_kw: 0.0412, q_loss_kvar: 0.0641, i_pu: 0.0112 }
  ]
};

// Global State Store
const state = {
  dgList: [],
  vMin: 0.95,
  vMax: 1.05,
  selectedBusId: 18,
  baseData: DEFAULT_SYSTEM_DATA,
  currentData: JSON.parse(JSON.stringify(DEFAULT_SYSTEM_DATA)),
};

// Chart instances store
let charts = {
  voltage: null,
  loss: null,
  lossDist: null,
  angle: null,
};

// Leaflet map instances
let leafletMap = null;
let mapBranchesLayer = null;
let mapBusesLayer = null;

// Bootstrap Document Ready
document.addEventListener('DOMContentLoaded', () => {
  // 1. Setup Charts FIRST with direct pre-loaded seed datasets
  try {
    initCharts();
  } catch (e) {
    console.warn('Chart.js error, native SVG activated:', e);
    renderFallbackSVGCharts(state.currentData, state.baseData);
  }

  // 2. Setup Leaflet with safe fallback
  try {
    initLeaflet();
  } catch (e) {
    console.warn('Leaflet error, switching to Schematic:', e);
    switchToSchematic();
  }

  // 3. Bind interactive inputs and events
  bindEventHandlers();

  // 4. Render all UI elements immediately
  renderDashboard();

  // 5. Connect to live solver backend
  fetchSimulation();
});

// ---------------------------------------------------------------------------
// Leaflet Map Initialization
// ---------------------------------------------------------------------------
function initLeaflet() {
  if (typeof L === 'undefined') {
    switchToSchematic();
    return;
  }

  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  leafletMap = L.map('leaflet-map', {
    zoomControl: true,
    attributionControl: false,
  });

  mapBranchesLayer = L.layerGroup().addTo(leafletMap);
  mapBusesLayer = L.layerGroup().addTo(leafletMap);

  renderLeafletMap(state.currentData);

  // Auto-fit network bounds smoothly with padding
  if (state.currentData && state.currentData.nodes && state.currentData.nodes.length > 0) {
    const bounds = L.latLngBounds(state.currentData.nodes.map(n => [n.lat, n.lng]));
    leafletMap.fitBounds(bounds, { padding: [35, 35] });
  } else {
    leafletMap.setView([37.7749, -122.4160], 14);
  }
}

function switchToSchematic() {
  const mapCont = document.getElementById('leaflet-container');
  const schemCont = document.getElementById('schematic-container');
  const tabMap = document.getElementById('tab-map');
  const tabSchem = document.getElementById('tab-schematic');

  if (mapCont && schemCont) {
    mapCont.classList.add('hidden');
    schemCont.classList.remove('hidden');
    if (tabSchem) tabSchem.className = 'px-3 py-1.5 text-xs font-bold rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/50';
    if (tabMap) tabMap.className = 'px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:text-white';
  }
}

// ---------------------------------------------------------------------------
// Chart.js High-Contrast Setup (Loaded with Initial Data Immediately)
// ---------------------------------------------------------------------------
function initCharts() {
  if (typeof Chart === 'undefined') {
    renderFallbackSVGCharts(state.currentData, state.baseData);
    return;
  }

  // High-contrast typography defaults for Chart.js
  Chart.defaults.color = '#e2e8f0';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.font.weight = '600';
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.12)';

  const busLabels = state.currentData.nodes.map(n => `Bus ${n.id}`);
  const baseVoltages = state.baseData.nodes.map(n => n.vmag);
  const currentVoltages = state.currentData.nodes.map(n => n.vmag);
  const minLimitLine = Array(33).fill(state.vMin);
  const maxLimitLine = Array(33).fill(state.vMax);

  const branchLabels = state.currentData.edges.map(e => `${e.from}→${e.to}`);
  const pLosses = state.currentData.edges.map(e => e.p_loss_kw);
  const qLosses = state.currentData.edges.map(e => e.q_loss_kvar);

  const angles = state.currentData.nodes.map(n => n.vang);

  // 1. Voltage Profile Chart
  const ctxVoltage = document.getElementById('voltage-chart');
  if (ctxVoltage) {
    charts.voltage = new Chart(ctxVoltage.getContext('2d'), {
      type: 'line',
      data: {
        labels: busLabels,
        datasets: [
          {
            label: 'Base Case (No DG)',
            data: baseVoltages,
            borderColor: '#94a3b8',
            borderDash: [5, 4],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#94a3b8',
            tension: 0.15,
          },
          {
            label: 'Active Scenario',
            data: currentVoltages,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            borderWidth: 2.8,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#38bdf8',
            fill: true,
            tension: 0.15,
          },
          {
            label: 'Lower Limit (0.95 p.u.)',
            data: minLimitLine,
            borderColor: '#fb7185',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Upper Limit (1.05 p.u.)',
            data: maxLimitLine,
            borderColor: '#fbbf24',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#ffffff', boxWidth: 12, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(56, 189, 248, 0.4)',
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          y: {
            title: { display: true, text: 'Voltage Magnitude (p.u.)', color: '#38bdf8' },
            ticks: { color: '#ffffff', font: { weight: '600' } },
            min: 0.90,
            max: 1.06,
          },
          x: {
            title: { display: true, text: 'Bus Identifier', color: '#cbd5e1' },
            ticks: { color: '#ffffff', font: { weight: '600' } },
            grid: { display: false },
          },
        },
      },
    });
  }

  // 2. Branch Power Losses Chart
  const ctxLoss = document.getElementById('loss-chart');
  if (ctxLoss) {
    charts.loss = new Chart(ctxLoss.getContext('2d'), {
      type: 'bar',
      data: {
        labels: branchLabels,
        datasets: [
          {
            label: 'Active Loss P (kW)',
            data: pLosses,
            backgroundColor: 'rgba(56, 189, 248, 0.9)',
            borderRadius: 3,
          },
          {
            label: 'Reactive Loss Q (kVAR)',
            data: qLosses,
            backgroundColor: 'rgba(129, 140, 248, 0.85)',
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#ffffff', boxWidth: 12, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
          },
        },
        scales: {
          y: {
            title: { display: true, text: 'Loss (kW / kVAR)', color: '#38bdf8' },
            ticks: { color: '#ffffff', font: { weight: '600' } },
            beginAtZero: true,
          },
          x: {
            title: { display: true, text: 'Feeder Branch', color: '#cbd5e1' },
            ticks: { color: '#ffffff', font: { weight: '600' } },
            grid: { display: false },
          },
        },
      },
    });
  }

  // 3. Loss Distribution Donut Chart
  const ctxLossDist = document.getElementById('loss-dist-chart');
  if (ctxLossDist) {
    const edgeLossPairs = state.currentData.edges.map(e => ({
      label: `Branch ${e.from}→${e.to}`,
      val: e.p_loss_kw,
    })).sort((a, b) => b.val - a.val);

    const topBranches = edgeLossPairs.slice(0, 8);
    const remainingLoss = edgeLossPairs.slice(8).reduce((acc, curr) => acc + curr.val, 0);

    charts.lossDist = new Chart(ctxLossDist.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: [...topBranches.map(t => t.label), 'Other Branches'],
        datasets: [
          {
            data: [...topBranches.map(t => t.val), remainingLoss],
            backgroundColor: [
              '#38bdf8', '#0284c7', '#2dd4bf', '#059669', '#818cf8',
              '#a855f7', '#ec4899', '#fb7185', '#f97316', '#fbbf24', '#64748b'
            ],
            borderColor: '#0f172a',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ffffff', boxWidth: 12, usePointStyle: true, font: { size: 10, weight: '600' } },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw.toFixed(3)} kW`,
            },
          },
        },
      },
    });
  }

  // 4. Voltage Angle Chart
  const ctxAngle = document.getElementById('angle-chart');
  if (ctxAngle) {
    charts.angle = new Chart(ctxAngle.getContext('2d'), {
      type: 'line',
      data: {
        labels: busLabels,
        datasets: [
          {
            label: 'Voltage Angle (Degrees)',
            data: angles,
            borderColor: '#2dd4bf',
            backgroundColor: 'rgba(45, 212, 191, 0.15)',
            borderWidth: 2.5,
            pointRadius: 3.5,
            pointBackgroundColor: '#2dd4bf',
            fill: true,
            tension: 0.15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#ffffff', boxWidth: 12, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(45, 212, 191, 0.4)',
            borderWidth: 1,
          },
        },
        scales: {
          y: {
            title: { display: true, text: 'Phase Angle (deg)', color: '#2dd4bf' },
            ticks: { color: '#ffffff', font: { weight: '600' } },
          },
          x: {
            title: { display: true, text: 'Bus Identifier', color: '#cbd5e1' },
            ticks: { color: '#ffffff', font: { weight: '600' } },
            grid: { display: false },
          },
        },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Fallback Native SVG Charts (100% Guaranteed Display)
// ---------------------------------------------------------------------------
function renderFallbackSVGCharts(current, base) {
  // 1. Voltage Profile SVG
  const vBox = document.getElementById('voltage-chart');
  if (vBox && vBox.parentElement) {
    const parent = vBox.parentElement;
    const vmin = 0.90, vmax = 1.05;
    const pts = current.nodes.map((n, i) => {
      const x = 35 + (i / 32) * 430;
      const y = 230 - ((n.vmag - vmin) / (vmax - vmin)) * 190;
      return `${x},${y}`;
    }).join(' ');

    const basePts = base.nodes.map((n, i) => {
      const x = 35 + (i / 32) * 430;
      const y = 230 - ((n.vmag - vmin) / (vmax - vmin)) * 190;
      return `${x},${y}`;
    }).join(' ');

    parent.innerHTML = `
      <svg viewBox="0 0 500 260" class="chart-fallback-svg">
        <line x1="35" y1="230" x2="480" y2="230" stroke="#475569" stroke-width="2" />
        <line x1="35" y1="20" x2="35" y2="230" stroke="#475569" stroke-width="2" />
        <line x1="35" y1="167" x2="480" y2="167" stroke="#fb7185" stroke-dasharray="6,4" stroke-width="2" />
        <text x="400" y="160" fill="#fb7185" font-size="11" font-weight="bold" font-family="sans-serif">0.95 p.u. limit</text>
        <polyline points="${basePts}" fill="none" stroke="#94a3b8" stroke-dasharray="5,4" stroke-width="2.2" />
        <polyline points="${pts}" fill="none" stroke="#38bdf8" stroke-width="3" />
        ${current.nodes.map((n, i) => {
          const x = 35 + (i / 32) * 430;
          const y = 230 - ((n.vmag - vmin) / (vmax - vmin)) * 190;
          return `<circle cx="${x}" cy="${y}" r="3.5" fill="#38bdf8" stroke="#ffffff" stroke-width="1" />`;
        }).join('')}
        <text x="250" y="254" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">Feeder Buses (1 to 33)</text>
      </svg>
    `;
  }

  // 2. Branch Losses Bar SVG
  const lBox = document.getElementById('loss-chart');
  if (lBox && lBox.parentElement) {
    const parent = lBox.parentElement;
    const maxLoss = 55;
    parent.innerHTML = `
      <svg viewBox="0 0 500 260" class="chart-fallback-svg">
        <line x1="35" y1="230" x2="480" y2="230" stroke="#475569" stroke-width="2" />
        ${current.edges.map((e, i) => {
          const x = 40 + i * 13.5;
          const h = (e.p_loss_kw / maxLoss) * 190;
          const y = 230 - h;
          return `<rect x="${x}" y="${y}" width="9" height="${h}" fill="#38bdf8" rx="2" stroke="#ffffff" stroke-width="0.5" />`;
        }).join('')}
        <text x="250" y="254" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">Branches (1 to 32)</text>
      </svg>
    `;
  }
}

// ---------------------------------------------------------------------------
// Network Simulation Fetcher
// ---------------------------------------------------------------------------
async function fetchSimulation() {
  try {
    showLoading(true);
    const payload = {
      dg: state.dgList,
      v_min: state.vMin,
      v_max: state.vMax,
    };

    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();

    state.currentData = data.current;
    state.baseData = data.base;

    renderDashboard();
    showToast('Power flow recalculated successfully.');
  } catch (err) {
    console.warn('Backend server not connected. Running with local client data:', err);
    showToast('Running in local mode. Start python server.py for dynamic recalculations.');
  } finally {
    showLoading(false);
  }
}

// ---------------------------------------------------------------------------
// Dashboard Render Coordinator
// ---------------------------------------------------------------------------
function renderDashboard() {
  if (!state.currentData) return;

  renderMetrics(state.currentData.metrics);
  updateChartData(state.currentData, state.baseData);
  renderLeafletMap(state.currentData);
  renderSchematic(state.currentData);
  renderActiveDGList();
  renderBusTable(state.currentData.nodes);
  renderBranchTable(state.currentData.edges);
}

// ---------------------------------------------------------------------------
// Metric Ribbon Rendering
// ---------------------------------------------------------------------------
function renderMetrics(m) {
  document.getElementById('metric-total-load').textContent = `${m.total_load_kw.toLocaleString()} kW`;
  document.getElementById('metric-total-load-sub').textContent = `${m.total_load_kvar.toLocaleString()} kVAR`;

  document.getElementById('metric-total-gen').textContent = `${m.total_gen_kw.toLocaleString()} kW`;
  document.getElementById('metric-total-gen-sub').textContent = `${m.total_gen_kvar.toLocaleString()} kVAR`;

  document.getElementById('metric-ploss').textContent = `${m.total_ploss_kw.toFixed(2)} kW`;
  document.getElementById('metric-ploss-sub').textContent = `${m.loss_pct.toFixed(2)}% of load`;

  document.getElementById('metric-qloss').textContent = `${m.total_qloss_kvar.toFixed(2)} kVAR`;

  document.getElementById('metric-min-v').textContent = `${m.min_voltage_pu.toFixed(4)} p.u.`;
  document.getElementById('metric-min-v-sub').textContent = `Bus ${m.min_voltage_bus}`;

  const violContainer = document.getElementById('metric-violations');
  if (violContainer) {
    if (m.n_under === 0 && m.n_over === 0) {
      violContainer.innerHTML = '<span class="status-pill status-nominal">Nominal Profile</span>';
    } else {
      let pills = '';
      if (m.n_under > 0) pills += `<span class="status-pill status-warning mr-1.5">${m.n_under} Under</span>`;
      if (m.n_over > 0) pills += `<span class="status-pill status-caution">${m.n_over} Over</span>`;
      violContainer.innerHTML = pills;
    }
  }

  const solverBadge = document.getElementById('solver-badge');
  if (solverBadge) {
    solverBadge.textContent = m.converged ? `Converged (${m.iterations} iters)` : 'Non-Convergent';
    solverBadge.className = m.converged ? 'status-pill status-nominal' : 'status-pill status-warning';
  }
}

// ---------------------------------------------------------------------------
// Charts Data Updater
// ---------------------------------------------------------------------------
function updateChartData(current, base) {
  if (typeof Chart === 'undefined') {
    renderFallbackSVGCharts(current, base);
    return;
  }

  if (!charts.voltage || !charts.loss) return;

  const busLabels = current.nodes.map(n => `Bus ${n.id}`);
  const currentVoltages = current.nodes.map(n => n.vmag);
  const baseVoltages = base.nodes.map(n => n.vmag);
  const minLimitLine = Array(current.nodes.length).fill(state.vMin);
  const maxLimitLine = Array(current.nodes.length).fill(state.vMax);

  // Voltage Chart
  charts.voltage.data.labels = busLabels;
  charts.voltage.data.datasets[0].data = baseVoltages;
  charts.voltage.data.datasets[1].data = currentVoltages;
  charts.voltage.data.datasets[2].data = minLimitLine;
  charts.voltage.data.datasets[3].data = maxLimitLine;
  charts.voltage.update();

  // Branch Losses Chart
  const branchLabels = current.edges.map(e => `${e.from}→${e.to}`);
  const pLosses = current.edges.map(e => e.p_loss_kw);
  const qLosses = current.edges.map(e => e.q_loss_kvar);

  charts.loss.data.labels = branchLabels;
  charts.loss.data.datasets[0].data = pLosses;
  charts.loss.data.datasets[1].data = qLosses;
  charts.loss.update();

  // Loss Distribution Donut
  const edgeLossPairs = current.edges.map(e => ({
    label: `Branch ${e.from}→${e.to}`,
    val: e.p_loss_kw,
  })).sort((a, b) => b.val - a.val);

  const topBranches = edgeLossPairs.slice(0, 8);
  const remainingLoss = edgeLossPairs.slice(8).reduce((acc, curr) => acc + curr.val, 0);

  charts.lossDist.data.labels = [...topBranches.map(t => t.label), 'Other Branches'];
  charts.lossDist.data.datasets[0].data = [...topBranches.map(t => t.val), remainingLoss];
  charts.lossDist.update();

  // Phase Angle Chart
  const angles = current.nodes.map(n => n.vang);
  charts.angle.data.labels = busLabels;
  charts.angle.data.datasets[0].data = angles;
  charts.angle.update();
}

// ---------------------------------------------------------------------------
// Leaflet Map Rendering (With Permanent High-Contrast Bus Number Tooltips)
// ---------------------------------------------------------------------------
function renderLeafletMap(data) {
  if (!leafletMap || !mapBranchesLayer || !mapBusesLayer) return;

  mapBranchesLayer.clearLayers();
  mapBusesLayer.clearLayers();

  const nodeMap = {};
  data.nodes.forEach(n => { nodeMap[n.id] = n; });

  const maxLoss = Math.max(...data.edges.map(e => e.p_loss_kw), 1);
  data.edges.forEach(edge => {
    const fromNode = nodeMap[edge.from];
    const toNode = nodeMap[edge.to];
    if (!fromNode || !toNode) return;

    const weight = 2.5 + (edge.p_loss_kw / maxLoss) * 5;
    const polyline = L.polyline([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]], {
      color: '#475569',
      weight: weight,
      opacity: 0.85,
    });

    polyline.bindTooltip(`
      <div class="font-mono text-xs">
        <div class="font-bold text-white">Branch ${edge.from} → ${edge.to}</div>
        <div>P Loss: <span class="text-cyan-400 font-semibold">${edge.p_loss_kw} kW</span></div>
        <div>Q Loss: ${edge.q_loss_kvar} kVAR</div>
        <div>R: ${edge.r_ohm} Ω | X: ${edge.x_ohm} Ω</div>
      </div>
    `);

    mapBranchesLayer.addLayer(polyline);
  });

  data.nodes.forEach(node => {
    let fillColor = '#34d399';
    if (node.is_slack) fillColor = '#818cf8';
    else if (node.violation === 'under') fillColor = '#fb7185';
    else if (node.violation === 'over') fillColor = '#fbbf24';

    const circle = L.circleMarker([node.lat, node.lng], {
      radius: node.is_slack ? 9 : (node.has_dg ? 8 : 6.5),
      fillColor: fillColor,
      fillOpacity: 0.95,
      color: node.has_dg ? '#38bdf8' : '#0f172a',
      weight: node.has_dg ? 3.5 : 2,
    });

    // Permanent label showing bus ID with high contrast
    circle.bindTooltip(`Bus ${node.id}`, {
      permanent: true,
      direction: 'top',
      className: 'bus-leaflet-label',
      offset: [0, -7],
    });

    circle.on('click', () => {
      selectBus(node.id);
    });

    mapBusesLayer.addLayer(circle);
  });
}

// ---------------------------------------------------------------------------
// SVG Schematic Renderer (With High-Contrast Outlined Bus Numbers)
// ---------------------------------------------------------------------------
function renderSchematic(data) {
  const svg = document.getElementById('schematic-svg');
  if (!svg) return;
  svg.innerHTML = '';

  const nodeMap = {};
  data.nodes.forEach(n => { nodeMap[n.id] = n; });
  const maxLoss = Math.max(...data.edges.map(e => e.p_loss_kw), 1);

  // Edges
  data.edges.forEach(edge => {
    const f = nodeMap[edge.from];
    const t = nodeMap[edge.to];
    if (!f || !t) return;

    const strokeWidth = 2 + (edge.p_loss_kw / maxLoss) * 4;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', f.x);
    line.setAttribute('y1', f.y);
    line.setAttribute('x2', t.x);
    line.setAttribute('y2', t.y);
    line.setAttribute('stroke', '#64748b');
    line.setAttribute('stroke-width', strokeWidth);
    line.setAttribute('class', 'schematic-branch-line');

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `Branch ${edge.from}→${edge.to}\nP Loss: ${edge.p_loss_kw} kW\nR: ${edge.r_ohm} Ω, X: ${edge.x_ohm} Ω`;
    line.appendChild(title);

    svg.appendChild(line);
  });

  // Nodes
  data.nodes.forEach(node => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'schematic-bus-node');
    group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    group.onclick = () => selectBus(node.id);

    let fillColor = '#34d399';
    if (node.is_slack) fillColor = '#818cf8';
    else if (node.violation === 'under') fillColor = '#fb7185';
    else if (node.violation === 'over') fillColor = '#fbbf24';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', node.is_slack ? 9 : (node.has_dg ? 8 : 6.5));
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', node.has_dg ? '#38bdf8' : '#0a101d');
    circle.setAttribute('stroke-width', node.has_dg ? 3.5 : 2);
    group.appendChild(circle);

    // Highly visible outlined bus text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('y', -11);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'bus-node-label');
    text.textContent = node.id;
    group.appendChild(text);

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `Bus ${node.id} | V: ${node.vmag} p.u. | Load: ${node.p_load_kw} kW`;
    group.appendChild(title);

    svg.appendChild(group);
  });
}

// ---------------------------------------------------------------------------
// DG Management & Slider Synchronization
// ---------------------------------------------------------------------------
function selectBus(busId) {
  state.selectedBusId = busId;
  const busSelect = document.getElementById('dg-bus-select');
  if (busSelect) busSelect.value = busId;

  const busBadge = document.getElementById('selected-bus-badge');
  if (busBadge) busBadge.textContent = `Bus ${busId}`;

  const existing = state.dgList.find(d => d.bus_id === busId);
  const pSlider = document.getElementById('dg-p-slider');
  const qSlider = document.getElementById('dg-q-slider');
  const pVal = document.getElementById('dg-p-val');
  const qVal = document.getElementById('dg-q-val');

  if (existing) {
    if (pSlider) pSlider.value = existing.p_kw;
    if (qSlider) qSlider.value = existing.q_kvar;
    if (pVal) pVal.textContent = `${existing.p_kw} kW`;
    if (qVal) qVal.textContent = `${existing.q_kvar} kVAR`;
  } else {
    if (pSlider) pSlider.value = 200;
    if (qSlider) qSlider.value = 0;
    if (pVal) pVal.textContent = '200 kW';
    if (qVal) qVal.textContent = '0 kVAR';
  }
}

function renderActiveDGList() {
  const container = document.getElementById('active-dg-list');
  if (!container) return;

  if (state.dgList.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-slate-300 py-3 text-center border border-dashed border-slate-700 rounded-lg">
        No active distributed generation units.
      </div>`;
    return;
  }

  container.innerHTML = state.dgList.map(dg => `
    <div class="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs mb-1.5">
      <div>
        <div class="font-bold text-white">Bus ${dg.bus_id}</div>
        <div class="text-cyan-300 font-mono font-bold">${dg.p_kw} kW · ${dg.q_kvar} kVAR</div>
      </div>
      <button onclick="removeDG(${dg.bus_id})" class="text-slate-400 hover:text-rose-400 p-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  `).join('');
}

function removeDG(busId) {
  state.dgList = state.dgList.filter(d => d.bus_id !== busId);
  renderActiveDGList();
  fetchSimulation();
}

// ---------------------------------------------------------------------------
// Tables Rendering with High Contrast
// ---------------------------------------------------------------------------
function renderBusTable(nodes) {
  const tbody = document.getElementById('bus-table-body');
  if (!tbody) return;

  tbody.innerHTML = nodes.map(n => {
    let badge = '<span class="status-pill status-nominal">Nominal</span>';
    if (n.is_slack) badge = '<span class="status-pill status-slack">Substation</span>';
    else if (n.violation === 'under') badge = '<span class="status-pill status-warning">Under-voltage</span>';
    else if (n.violation === 'over') badge = '<span class="status-pill status-caution">Over-voltage</span>';

    return `
      <tr class="hover:bg-slate-800/50 transition text-xs border-b border-slate-800 font-mono">
        <td class="py-2.5 px-3 font-bold text-white">${n.id}</td>
        <td class="py-2.5 px-3 text-slate-200 font-medium">${n.p_load_kw.toFixed(1)}</td>
        <td class="py-2.5 px-3 text-slate-300">${n.q_load_kvar.toFixed(1)}</td>
        <td class="py-2.5 px-3 text-cyan-300 font-bold">${n.dg_p_kw > 0 ? n.dg_p_kw.toFixed(1) : '-'}</td>
        <td class="py-2.5 px-3 font-bold ${n.violation === 'under' ? 'text-rose-400' : 'text-emerald-400'}">${n.vmag.toFixed(5)}</td>
        <td class="py-2.5 px-3 text-slate-300">${n.vang.toFixed(3)}°</td>
        <td class="py-2.5 px-3 text-slate-200">${n.v_kv.toFixed(3)}</td>
        <td class="py-2.5 px-3 font-sans">${badge}</td>
      </tr>
    `;
  }).join('');
}

function renderBranchTable(edges) {
  const tbody = document.getElementById('branch-table-body');
  if (!tbody) return;

  tbody.innerHTML = edges.map((e, idx) => `
    <tr class="hover:bg-slate-800/50 transition text-xs border-b border-slate-800 font-mono">
      <td class="py-2.5 px-3 font-bold text-white">${idx + 1}</td>
      <td class="py-2.5 px-3 text-slate-200 font-semibold">${e.from} → ${e.to}</td>
      <td class="py-2.5 px-3 text-slate-300">${e.r_ohm.toFixed(4)}</td>
      <td class="py-2.5 px-3 text-slate-300">${e.x_ohm.toFixed(4)}</td>
      <td class="py-2.5 px-3 text-slate-300">${e.rx_ratio.toFixed(2)}</td>
      <td class="py-2.5 px-3 text-slate-200 font-medium">${e.i_pu.toFixed(5)}</td>
      <td class="py-2.5 px-3 font-bold text-cyan-300">${e.p_loss_kw.toFixed(4)}</td>
      <td class="py-2.5 px-3 text-slate-300">${e.q_loss_kvar.toFixed(4)}</td>
    </tr>
  `).join('');
}

// ---------------------------------------------------------------------------
// Event Handlers & Sliders
// ---------------------------------------------------------------------------
function bindEventHandlers() {
  const pSlider = document.getElementById('dg-p-slider');
  const pVal = document.getElementById('dg-p-val');
  if (pSlider && pVal) {
    pSlider.addEventListener('input', () => {
      pVal.textContent = `${pSlider.value} kW`;
    });
  }

  const qSlider = document.getElementById('dg-q-slider');
  const qVal = document.getElementById('dg-q-val');
  if (qSlider && qVal) {
    qSlider.addEventListener('input', () => {
      qVal.textContent = `${qSlider.value} kVAR`;
    });
  }

  const btnApply = document.getElementById('btn-apply-dg');
  if (btnApply) {
    btnApply.addEventListener('click', () => {
      const busId = parseInt(document.getElementById('dg-bus-select').value);
      const pKw = parseFloat(document.getElementById('dg-p-slider').value) || 0;
      const qKvar = parseFloat(document.getElementById('dg-q-slider').value) || 0;

      state.dgList = state.dgList.filter(d => d.bus_id !== busId);
      if (pKw > 0 || qKvar !== 0) {
        state.dgList.push({ bus_id: busId, p_kw: pKw, q_kvar: qKvar });
      }

      renderActiveDGList();
      fetchSimulation();
    });
  }

  const btnClear = document.getElementById('btn-clear-dg');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      state.dgList = [];
      renderActiveDGList();
      fetchSimulation();
    });
  }

  const p18 = document.getElementById('preset-bus18');
  if (p18) {
    p18.addEventListener('click', () => {
      state.dgList = [{ bus_id: 18, p_kw: 500, q_kvar: 0 }];
      selectBus(18);
      renderActiveDGList();
      fetchSimulation();
    });
  }

  const pMulti = document.getElementById('preset-multi');
  if (pMulti) {
    pMulti.addEventListener('click', () => {
      state.dgList = [
        { bus_id: 14, p_kw: 250, q_kvar: 0 },
        { bus_id: 18, p_kw: 300, q_kvar: 50 },
        { bus_id: 32, p_kw: 200, q_kvar: 0 },
      ];
      selectBus(18);
      renderActiveDGList();
      fetchSimulation();
    });
  }

  const tabMap = document.getElementById('tab-map');
  const tabSchem = document.getElementById('tab-schematic');
  if (tabMap && tabSchem) {
    tabMap.addEventListener('click', () => {
      document.getElementById('leaflet-container').classList.remove('hidden');
      document.getElementById('schematic-container').classList.add('hidden');
      tabMap.className = 'px-3 py-1.5 text-xs font-bold rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/50';
      tabSchem.className = 'px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:text-white';
      if (leafletMap) leafletMap.invalidateSize();
    });

    tabSchem.addEventListener('click', switchToSchematic);
  }

  const busSel = document.getElementById('dg-bus-select');
  if (busSel) {
    busSel.addEventListener('change', (e) => {
      selectBus(parseInt(e.target.value));
    });
  }

  const vminIn = document.getElementById('vmin-input');
  if (vminIn) {
    vminIn.addEventListener('change', (e) => {
      state.vMin = parseFloat(e.target.value) || 0.95;
      fetchSimulation();
    });
  }

  const vmaxIn = document.getElementById('vmax-input');
  if (vmaxIn) {
    vmaxIn.addEventListener('change', (e) => {
      state.vMax = parseFloat(e.target.value) || 1.05;
      fetchSimulation();
    });
  }
}

// ---------------------------------------------------------------------------
// Toast Notification & Loading Helpers
// ---------------------------------------------------------------------------
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `fixed bottom-4 right-4 px-4 py-2.5 rounded-lg text-xs font-bold border shadow-2xl z-50 transition-opacity duration-300 ${
    isError 
      ? 'bg-rose-950 text-rose-100 border-rose-600' 
      : 'bg-slate-900 text-slate-100 border-cyan-500/50'
  }`;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2800);
}

function showLoading(isLoading) {
  const spinner = document.getElementById('loading-indicator');
  if (spinner) {
    if (isLoading) spinner.classList.remove('hidden');
    else spinner.classList.add('hidden');
  }
}
