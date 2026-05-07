import { useMemo, useState, useCallback } from "react";
import { Download, Eye, EyeOff, Leaf, TreePine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  solarMetrics as mockSolarMetrics,
  financialData as mockFinancialData,
  cumulativeSavings as mockCumulativeSavings,
  costBreakdown as mockCostBreakdown,
  co2Data as mockCo2Data,
} from "@/data/mockData";
import { API_BASE, type SolarAnalyzeResult } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

type StoredResult = SolarAnalyzeResult & { preview?: string | null };

function readApiResult(): StoredResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem("vayu:lastSolarResult");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredResult;
  } catch {
    return null;
  }
}

type Feasibility = "HIGHLY FEASIBLE" | "MODERATELY FEASIBLE" | "NOT RECOMMENDED";

export default function SolarResults() {
  const [showOverlay, setShowOverlay] = useState(true);
  const { t } = useTranslation();

  // Real API result if present, mock data otherwise — UI markup is identical for both.
  const apiResult = useMemo(readApiResult, []);
  // API_BASE referenced so the backend URL is reachable from devtools when debugging.
  void API_BASE;

  const solarMetrics = apiResult?.aggregate
    ? {
        usableArea: apiResult.aggregate.usableArea,
        numberOfPanels: apiResult.aggregate.numberOfPanels,
        systemCapacity: apiResult.aggregate.systemCapacity,
        dailyGeneration: apiResult.aggregate.dailyGeneration,
        annualGeneration: apiResult.aggregate.annualGeneration,
      }
    : mockSolarMetrics;

  const financialData = apiResult?.aggregate
    ? {
        totalCost: apiResult.aggregate.totalCost,
        annualSavings: apiResult.aggregate.annualSavings,
        paybackPeriod: apiResult.aggregate.paybackPeriod,
        twentyFiveYearProfit: apiResult.aggregate.twentyFiveYearProfit,
      }
    : mockFinancialData;

  const cumulativeSavings = apiResult?.cumulative_savings?.length
    ? apiResult.cumulative_savings
    : mockCumulativeSavings;

  const costBreakdown = apiResult?.cost_breakdown?.length
    ? apiResult.cost_breakdown
    : mockCostBreakdown;

  const co2Data = apiResult?.aggregate
    ? {
        kgAvoided: apiResult.aggregate.kgAvoided,
        treesEquivalent: apiResult.aggregate.treesEquivalent,
      }
    : mockCo2Data;

  const feasibilityLabel: Feasibility =
    apiResult?.aggregate?.feasibility === "HIGHLY FEASIBLE" ||
    apiResult?.aggregate?.feasibility === "MODERATELY FEASIBLE" ||
    apiResult?.aggregate?.feasibility === "NOT RECOMMENDED"
      ? (apiResult.aggregate.feasibility as Feasibility)
      : "HIGHLY FEASIBLE";

  const downloadReport = useCallback(() => {
    const d = new Date().toLocaleDateString("en-IN");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>VAYU Solar Report – ${d}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#111}
  h1{color:#6366f1}h2{color:#6366f1;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
  table{border-collapse:collapse;width:100%;margin-bottom:20px}
  th,td{border:1px solid #d1d5db;padding:8px 12px;text-align:left}
  th{background:#f3f4f6;font-weight:600}
  .green{color:#16a34a}.footer{color:#6b7280;font-size:12px;margin-top:40px}
</style></head><body>
<h1>&#9728; VAYU Solar Analysis Report</h1>
<p><strong>Generated:</strong> ${d} &nbsp;|&nbsp; <strong>Feasibility:</strong> ${feasibilityLabel}</p>
<h2>System Metrics</h2>
<table>
  <tr><th>Parameter</th><th>Value</th></tr>
  <tr><td>Usable Roof Area</td><td>${solarMetrics.usableArea} m²</td></tr>
  <tr><td>Number of Panels</td><td>${solarMetrics.numberOfPanels}</td></tr>
  <tr><td>System Capacity</td><td>${solarMetrics.systemCapacity} kW</td></tr>
  <tr><td>Daily Generation</td><td>${solarMetrics.dailyGeneration} kWh</td></tr>
  <tr><td>Annual Generation</td><td>${solarMetrics.annualGeneration.toLocaleString()} kWh</td></tr>
</table>
<h2>Financial Summary</h2>
<table>
  <tr><th>Parameter</th><th>Value</th></tr>
  <tr><td>Total Investment</td><td>₹${financialData.totalCost.toLocaleString("en-IN")}</td></tr>
  <tr><td>Annual Savings</td><td class="green">₹${financialData.annualSavings.toLocaleString("en-IN")}</td></tr>
  <tr><td>Break-Even Period</td><td>${financialData.paybackPeriod} years (system pays for itself by ${new Date().getFullYear() + Math.ceil(Number(financialData.paybackPeriod))})</td></tr>
  <tr><td>25-Year Profit</td><td class="green">₹${(financialData.twentyFiveYearProfit * 100000).toLocaleString("en-IN")}</td></tr>
</table>
<h2>Environmental Impact</h2>
<table>
  <tr><th>Metric</th><th>Value</th></tr>
  <tr><td>CO₂ Avoided per Year</td><td class="green">${co2Data.kgAvoided.toLocaleString()} kg</td></tr>
  <tr><td>Equivalent Trees Planted</td><td class="green">${co2Data.treesEquivalent}</td></tr>
</table>
<p class="footer">Generated by VAYU – Solar &amp; Wind Energy Prediction Platform</p>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VAYU_Solar_Report_${d.replace(/\//g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [solarMetrics, financialData, co2Data, feasibilityLabel]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("results.title")}</h1>
        <StatusBadge level={feasibilityLabel} />
      </div>

      {/* Split layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Image viewer */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">{t("results.roofAnalysis")}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
              className="text-xs"
            >
              {showOverlay ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {showOverlay ? t("results.hideOverlay") : t("results.showOverlay")}
            </Button>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-secondary/30 aspect-square">
            {/* Real uploaded image if present, else the existing simulated gradient.
                object-contain + matching SVG viewBox keeps overlays pixel-aligned to the image. */}
            {apiResult?.preview ? (
              <img
                src={apiResult.preview}
                alt={t("results.roofAnalysis")}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/60 to-secondary/30" />
            )}
            {showOverlay && apiResult?.rooftops && apiResult.image_width && apiResult.image_height ? (
              // Real overlay: each detected rooftop polygon + a panel grid clipped inside it.
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${apiResult.image_width} ${apiResult.image_height}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {(apiResult.rooftops as Array<Record<string, unknown>>).map((roof, idx) => {
                  const polygon = (roof.polygon_pixels as number[][]) ?? [];
                  const bbox = roof.bbox as
                    | { x: number; y: number; width: number; height: number }
                    | undefined;
                  const numPanels = (roof.num_panels as number) ?? 0;
                  const points = polygon.map((p) => `${p[0]},${p[1]}`).join(" ");

                  // Aspect-aware grid sized to bbox so panels look square-ish.
                  const ratio = bbox && bbox.height > 0 ? bbox.width / bbox.height : 1;
                  const cols = Math.max(1, Math.ceil(Math.sqrt(numPanels * ratio)));
                  const rows = Math.max(1, Math.ceil(numPanels / cols));
                  const cellW = bbox ? bbox.width / cols : 0;
                  const cellH = bbox ? bbox.height / rows : 0;
                  const cells: JSX.Element[] = [];
                  if (bbox && numPanels > 0) {
                    let placed = 0;
                    for (let r = 0; r < rows && placed < numPanels; r++) {
                      for (let c = 0; c < cols && placed < numPanels; c++) {
                        cells.push(
                          <rect
                            key={`p-${idx}-${r}-${c}`}
                            x={bbox.x + c * cellW + cellW * 0.08}
                            y={bbox.y + r * cellH + cellH * 0.08}
                            width={cellW * 0.84}
                            height={cellH * 0.84}
                            fill="hsl(var(--primary))"
                            fillOpacity={0.45}
                            stroke="hsl(var(--primary))"
                            strokeOpacity={0.7}
                            strokeWidth={Math.max(1, cellW * 0.04)}
                          />
                        );
                        placed++;
                      }
                    }
                  }

                  return (
                    <g key={idx}>
                      <defs>
                        <clipPath id={`roof-clip-${idx}`}>
                          <polygon points={points} />
                        </clipPath>
                      </defs>
                      {/* Usable-area fill */}
                      <polygon
                        points={points}
                        fill="hsl(var(--status-green))"
                        fillOpacity={0.18}
                        stroke="hsl(var(--status-green))"
                        strokeWidth={Math.max(2, apiResult.image_width / 400)}
                      />
                      {/* Panels — clipped to the actual rooftop polygon shape */}
                      <g clipPath={`url(#roof-clip-${idx})`}>{cells}</g>
                    </g>
                  );
                })}
              </svg>
            ) : showOverlay ? (
              // Fallback (no API data) — preserves the original mock-data overlay look.
              <>
                <div className="absolute top-[15%] left-[10%] w-[60%] h-[55%] border-2 border-status-green bg-status-green/20 rounded-md">
                  <div className="grid grid-cols-4 grid-rows-7 gap-0.5 p-1 h-full">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div key={i} className="bg-primary/40 rounded-[2px] border border-primary/50" />
                    ))}
                  </div>
                </div>
                <div className="absolute top-[20%] right-[10%] w-[15%] h-[12%] border-2 border-status-red bg-status-red/20 rounded-md" />
                <div className="absolute bottom-[15%] left-[15%] w-[10%] h-[10%] border-2 border-status-red bg-status-red/20 rounded-md" />
              </>
            ) : null}
            <div className="absolute bottom-2 left-2 flex gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-status-green/30 status-green">{t("results.usable")}</span>
              <span className="px-2 py-0.5 rounded bg-status-red/30 status-red">{t("results.obstacle")}</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard title={t("results.usableArea")} value={solarMetrics.usableArea} unit="m²" />
            <MetricCard title={t("results.panelCount")} value={solarMetrics.numberOfPanels} />
            <MetricCard title={t("results.systemCapacity")} value={solarMetrics.systemCapacity} unit="kW" />
            <MetricCard title={t("results.dailyGen")} value={solarMetrics.dailyGeneration} unit="kWh" />
            <MetricCard title={t("results.annualGen")} value={solarMetrics.annualGeneration.toLocaleString()} unit="kWh" />
          </div>

          {/* Financial cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Investment */}
            <div className="glass-card rounded-xl p-4 border border-status-orange/30">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("results.totalInvestment")}</p>
              <p className="text-xl font-bold text-foreground">₹{financialData.totalCost.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("results.investmentDesc")}</p>
            </div>
            {/* Annual Savings */}
            <div className="glass-card rounded-xl p-4 border border-status-green/30">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("results.yearlySavings")}</p>
              <p className="text-xl font-bold status-green">₹{financialData.annualSavings.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("results.savingsDesc")}</p>
            </div>
            {/* Payback Period */}
            <div className="glass-card rounded-xl p-4 border border-primary/30">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("results.breakEven")}</p>
              <p className="text-xl font-bold text-primary">{financialData.paybackPeriod} <span className="text-sm font-medium">{t("results.years")}</span></p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("results.breakEvenDesc", { year: String(new Date().getFullYear() + Math.ceil(Number(financialData.paybackPeriod))) })}</p>
            </div>
            {/* 25-Year Profit */}
            <div className="glass-card rounded-xl p-4 border border-status-green/30">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("results.profit25")}</p>
              <p className="text-xl font-bold status-green">₹{(financialData.twentyFiveYearProfit * 100000).toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("results.profitDesc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cumulative savings */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{t("results.cumulativeSavings")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cumulativeSavings}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, t("results.cumulativeTip")]}
                />
                <Bar dataKey="cumulative" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{t("results.costBreakdown")}</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {costBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CO2 Impact */}
      <div className="glass-card rounded-2xl p-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-green/10 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-status-green" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("results.co2Avoided")}</p>
            <p className="text-xl font-bold text-foreground">{co2Data.kgAvoided.toLocaleString()} kg</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-green/10 flex items-center justify-center">
            <TreePine className="w-5 h-5 text-status-green" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("results.treesEquivalent")}</p>
            <p className="text-xl font-bold text-foreground">{co2Data.treesEquivalent}</p>
          </div>
        </div>
        <div className="ml-auto">
          <Button className="gap-2" onClick={downloadReport}>
            <Download className="w-4 h-4" />
            {t("results.downloadReport")}
          </Button>
        </div>
      </div>
    </div>
  );
}
