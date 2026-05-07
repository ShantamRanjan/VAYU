// Thin client for the VAYU Flask backend (vayu_backend/app.py).
// Configure via VITE_VAYU_API in solar-wind-energy-prediction/.env, falls back
// to http://localhost:5000 (Flask default).

export const API_BASE: string = import.meta.env.VITE_VAYU_API || "http://localhost:5000";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.error ?? detail;
    } catch {
      /* swallow */
    }
    throw new Error(`${res.status} ${detail}`);
  }
  return (await res.json()) as T;
}

// ───────────── Solar ─────────────
export interface RooftopDetection {
  polygon_pixels: number[][];
  bbox: { x: number; y: number; width: number; height: number };
  num_panels: number;
  system_kw: number;
  roof_area_sqm: number;
  usable_area_sqm: number;
  feasibility: string;
  [k: string]: unknown;
}

export interface SolarAnalyzeResult {
  rooftops: RooftopDetection[];
  rooftops_detected: number;
  detection_source?: "yolo" | "heuristic";
  detection_conf?: number | null;
  model_path?: string | null;
  aggregate: {
    usableArea: number;
    numberOfPanels: number;
    systemCapacity: number;
    dailyGeneration: number;
    annualGeneration: number;
    totalCost: number;
    annualSavings: number;
    paybackPeriod: number;
    twentyFiveYearProfit: number;
    kgAvoided: number;
    treesEquivalent: number;
    feasibility: string;
  };
  cumulative_savings: Array<{ year: number; savings: number; cumulative: number }>;
  cost_breakdown: Array<{ name: string; value: number; fill: string }>;
  upload_id: string;
  image_width: number;
  image_height: number;
}

export async function analyzeSolar(file: File): Promise<SolarAnalyzeResult> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_BASE}/api/solar/analyze`, {
    method: "POST",
    body: fd,
  });
  return jsonOrThrow<SolarAnalyzeResult>(res);
}

// ───────────── Wind ─────────────
export interface WindForecastPoint { hour: string; p10: number; p50: number; p90: number }
export interface WindForecastResponse {
  source: string;
  forecasts: Record<string, WindForecastPoint[]>;
}

export async function fetchWindForecast(): Promise<WindForecastResponse> {
  const res = await fetch(`${API_BASE}/api/wind/forecast`);
  return jsonOrThrow<WindForecastResponse>(res);
}

export interface WindAlert {
  id: string;
  time: string;
  date: string;
  location: string;
  speed: number;
  riskLevel: "Critical" | "Warning" | "Normal";
  action: string;
  delivery: string;
  transcript: string;
}
export interface WindAlertsResponse {
  alerts: WindAlert[];
  alert_level: string;
  overall: string;
  total_drop_mw: number;
  action_required: boolean;
}

export async function fetchWindAlerts(): Promise<WindAlertsResponse> {
  const res = await fetch(`${API_BASE}/api/wind/alerts`);
  return jsonOrThrow<WindAlertsResponse>(res);
}

export interface WindAccuracyResponse {
  mapeScore: number;
  drift_alerts: number;
  retrain_needed: boolean;
  accuracyData: Array<{ hour: string; predicted: number; actual: number }>;
  mape30Day: Array<{ day: string; mape: number }>;
  history: Array<{ date: string; plant: string; mape: number; drift_alert: boolean }>;
}

export async function fetchWindAccuracy(): Promise<WindAccuracyResponse> {
  const res = await fetch(`${API_BASE}/api/wind/accuracy`);
  return jsonOrThrow<WindAccuracyResponse>(res);
}

// ───────────── Layer 3 agents ─────────────
export async function runOrchestrator(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/orchestrator/run`);
  return jsonOrThrow(res);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
