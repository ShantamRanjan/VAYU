// Mock data for Solar Rooftop Analyzer

export const solarMetrics = {
  usableArea: 145,
  numberOfPanels: 28,
  systemCapacity: 11.2,
  dailyGeneration: 44.8,
  annualGeneration: 16352,
};

export const financialData = {
  totalCost: 672000,
  annualSavings: 130816,
  paybackPeriod: 5.1,
  twentyFiveYearProfit: 26.5,
};

export const cumulativeSavings = Array.from({ length: 25 }, (_, i) => ({
  year: i + 1,
  savings: Math.round((i + 1) * 130816 - 672000),
  cumulative: Math.round((i + 1) * 130816),
}));

export const costBreakdown = [
  { name: "Solar Panels", value: 403200, fill: "hsl(210, 100%, 55%)" },
  { name: "Installation", value: 134400, fill: "hsl(160, 84%, 45%)" },
  { name: "Inverter", value: 100800, fill: "hsl(30, 95%, 60%)" },
  { name: "Wiring & BOS", value: 33600, fill: "hsl(280, 70%, 60%)" },
];

export const co2Data = {
  kgAvoided: 13098,
  treesEquivalent: 596,
};

// Mock data for Wind Risk Monitor

export interface WindLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  speed100m: number;
  direction: number;
  directionLabel: string;
  trend: "Rising" | "Falling" | "Stable";
  riskScore: number;
  riskLevel: "Normal" | "Warning" | "Critical";
  lastUpdated: string;
  forecast6h: number;
}

export const windLocations: WindLocation[] = [
  {
    id: "chit",
    name: "Chitradurga",
    lat: 14.2226,
    lng: 76.3987,
    speed: 18.5,
    speed100m: 24.2,
    direction: 225,
    directionLabel: "SW",
    trend: "Rising",
    riskScore: 4,
    riskLevel: "Normal",
    lastUpdated: "2 mins ago",
    forecast6h: 22.1,
  },
  {
    id: "gad",
    name: "Gadag",
    lat: 15.4167,
    lng: 75.6167,
    speed: 27.3,
    speed100m: 31.8,
    direction: 270,
    directionLabel: "W",
    trend: "Rising",
    riskScore: 7,
    riskLevel: "Warning",
    lastUpdated: "1 min ago",
    forecast6h: 32.5,
  },
  {
    id: "dav",
    name: "Davangere",
    lat: 14.4644,
    lng: 75.9218,
    speed: 33.1,
    speed100m: 38.6,
    direction: 250,
    directionLabel: "WSW",
    trend: "Rising",
    riskScore: 9,
    riskLevel: "Critical",
    lastUpdated: "30 secs ago",
    forecast6h: 36.2,
  },
];

export const alertLog = [
  { id: "1", time: "14:32", date: "2026-05-02", location: "Davangere", speed: 33.1, riskLevel: "Critical" as const, action: "Auto-call initiated to site manager", delivery: "Delivered", transcript: "Alert: Wind speed at Davangere has reached 33.1 m/s, classified as Critical. Please initiate emergency shutdown procedures for turbines T1 through T5. Acknowledge this alert by pressing 1." },
  { id: "2", time: "14:15", date: "2026-05-02", location: "Gadag", speed: 28.7, riskLevel: "Warning" as const, action: "SMS alert sent", delivery: "Delivered", transcript: "Warning: Wind speed at Gadag is 28.7 m/s. Monitor situation closely." },
  { id: "3", time: "13:45", date: "2026-05-02", location: "Gadag", speed: 26.1, riskLevel: "Warning" as const, action: "SMS alert sent", delivery: "Delivered", transcript: "Warning: Wind speed at Gadag has crossed 25 m/s threshold." },
  { id: "4", time: "12:00", date: "2026-05-02", location: "Davangere", speed: 30.2, riskLevel: "Critical" as const, action: "Auto-call initiated", delivery: "Escalated", transcript: "Critical alert: Davangere wind speed 30.2 m/s. First responder did not answer. Escalating to regional manager." },
  { id: "5", time: "11:30", date: "2026-05-02", location: "Chitradurga", speed: 24.8, riskLevel: "Normal" as const, action: "Logged only", delivery: "N/A", transcript: "" },
];

export const callLog = [
  { id: "1", recipient: "Rajesh Kumar (Site Manager)", phone: "+91 98xxx xxxxx", time: "14:32", duration: "0:42", status: "Answered" as const, escalated: false, transcript: "Hello, this is VAYU automated alert system. Wind speed at Davangere has reached critical level at 33.1 meters per second. Please initiate shutdown procedures. Press 1 to acknowledge." },
  { id: "2", recipient: "Priya Sharma (Shift Lead)", phone: "+91 97xxx xxxxx", time: "12:01", duration: "0:00", status: "Not Answered" as const, escalated: true, transcript: "" },
  { id: "3", recipient: "Anil Patil (Regional Mgr)", phone: "+91 96xxx xxxxx", time: "12:02", duration: "1:15", status: "Answered" as const, escalated: true, transcript: "Escalated call: Previous recipient did not answer. Wind speed at Davangere is 30.2 m/s. Emergency protocols should be activated." },
  { id: "4", recipient: "Rajesh Kumar (Site Manager)", phone: "+91 98xxx xxxxx", time: "11:30", duration: "0:35", status: "Answered" as const, escalated: false, transcript: "Routine check-in call. All systems normal at Chitradurga." },
];

export const forecastData = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const base = 20 + Math.sin(i / 4) * 8 + Math.random() * 3;
  return {
    hour: `${hour.toString().padStart(2, "0")}:00`,
    p10: Math.round((base - 4) * 10) / 10,
    p50: Math.round(base * 10) / 10,
    p90: Math.round((base + 5) * 10) / 10,
  };
});

export const accuracyData = Array.from({ length: 24 }, (_, i) => {
  const predicted = 45 + Math.sin(i / 3) * 15 + Math.random() * 5;
  const actual = predicted + (Math.random() - 0.5) * 12;
  return {
    hour: `${i.toString().padStart(2, "0")}:00`,
    predicted: Math.round(predicted * 10) / 10,
    actual: Math.round(actual * 10) / 10,
  };
});

export const mapeScore = 8.7;

export const mape30Day = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  mape: Math.round((6 + Math.random() * 8) * 10) / 10,
}));
