import { useQueries } from "@tanstack/react-query";

// ─── Configuration ──────────────────────────────────────────────────
// Replace with your OpenWeatherMap API key
const OWM_API_KEY = "2c0425e797102f6cc85687e7b372f584";
const REFETCH_INTERVAL = 60_000; // 60 seconds

// ─── Karnataka Locations ────────────────────────────────────────────
export interface KarnatakaStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const KARNATAKA_STATIONS: KarnatakaStation[] = [
  { id: "bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { id: "mysuru", name: "Mysuru", lat: 12.2958, lng: 76.6394 },
  { id: "hubli", name: "Hubli-Dharwad", lat: 15.3647, lng: 75.124 },
  { id: "mangaluru", name: "Mangaluru", lat: 12.9141, lng: 74.856 },
  { id: "belagavi", name: "Belagavi", lat: 15.8497, lng: 74.4977 },
  { id: "davanagere", name: "Davanagere", lat: 14.4644, lng: 75.9218 },
  { id: "bellary", name: "Bellary", lat: 15.1394, lng: 76.9214 },
  { id: "gulbarga", name: "Kalaburagi", lat: 17.329, lng: 76.8343 },
  { id: "shimoga", name: "Shimoga", lat: 13.9299, lng: 75.5681 },
  { id: "tumkur", name: "Tumkur", lat: 13.3379, lng: 77.1173 },
  { id: "chitradurga", name: "Chitradurga", lat: 14.2226, lng: 76.3987 },
  { id: "gadag", name: "Gadag", lat: 15.4167, lng: 75.6167 },
];

// ─── Types ──────────────────────────────────────────────────────────
export type RiskLevel = "Normal" | "Warning" | "Critical";

export interface LiveWindLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  windSpeed: number;      // m/s
  windDeg: number;        // degrees
  windGust: number;       // m/s
  temp: number;           // °C
  humidity: number;       // %
  description: string;
  icon: string;
  lastUpdated: Date;
  riskLevel: RiskLevel;
  riskScore: number;      // 0-10
  directionLabel: string;
}

// ─── Helpers ────────────────────────────────────────────────────────
function classifyRisk(speed: number): { riskLevel: RiskLevel; riskScore: number } {
  if (speed >= 30) return { riskLevel: "Critical", riskScore: Math.min(10, Math.round(speed / 4)) };
  if (speed >= 20) return { riskLevel: "Warning", riskScore: Math.min(9, Math.round(speed / 4)) };
  if (speed >= 10) return { riskLevel: "Normal", riskScore: Math.round(speed / 5) };
  return { riskLevel: "Normal", riskScore: Math.max(1, Math.round(speed / 3)) };
}

function degToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

async function fetchWindForStation(station: KarnatakaStation): Promise<LiveWindLocation> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${station.lat}&lon=${station.lng}&appid=${OWM_API_KEY}&units=metric`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch weather for ${station.name}: ${res.statusText}`);
  }

  const data = await res.json();
  const windSpeed = data.wind?.speed ?? 0;
  const windDeg = data.wind?.deg ?? 0;
  const windGust = data.wind?.gust ?? windSpeed;
  const { riskLevel, riskScore } = classifyRisk(windSpeed);

  return {
    id: station.id,
    name: station.name,
    lat: station.lat,
    lng: station.lng,
    windSpeed,
    windDeg,
    windGust,
    temp: data.main?.temp ?? 0,
    humidity: data.main?.humidity ?? 0,
    description: data.weather?.[0]?.description ?? "",
    icon: data.weather?.[0]?.icon ?? "01d",
    lastUpdated: new Date(),
    riskLevel,
    riskScore,
    directionLabel: degToCompass(windDeg),
  };
}

// ─── Hook ───────────────────────────────────────────────────────────
export function useWindData() {
  const results = useQueries({
    queries: KARNATAKA_STATIONS.map((station) => ({
      queryKey: ["wind", station.id],
      queryFn: () => fetchWindForStation(station),
      refetchInterval: REFETCH_INTERVAL,
      staleTime: REFETCH_INTERVAL - 5000,
      retry: 2,
    })),
  });

  const locations: LiveWindLocation[] = results
    .filter((r) => r.data != null)
    .map((r) => r.data!);

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const errors = results
    .filter((r) => r.error)
    .map((r) => (r.error as Error).message);

  const refetchAll = () => {
    results.forEach((r) => r.refetch());
  };

  return { locations, isLoading, isError, errors, refetchAll };
}
