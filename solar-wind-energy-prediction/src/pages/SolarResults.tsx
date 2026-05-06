import { useState } from "react";
import { Download, Eye, EyeOff, Leaf, TreePine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { solarMetrics, financialData, cumulativeSavings, costBreakdown, co2Data } from "@/data/mockData";

export default function SolarResults() {
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Analysis Results</h1>
        <StatusBadge level="HIGHLY FEASIBLE" />
      </div>

      {/* Split layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Image viewer */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Roof Analysis</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
              className="text-xs"
            >
              {showOverlay ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {showOverlay ? "Hide" : "Show"} Overlay
            </Button>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-secondary/30 aspect-square">
            {/* Simulated roof view with overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/60 to-secondary/30" />
            {showOverlay && (
              <>
                {/* Usable area (green) */}
                <div className="absolute top-[15%] left-[10%] w-[60%] h-[55%] border-2 border-status-green bg-status-green/20 rounded-md">
                  {/* Panel grid */}
                  <div className="grid grid-cols-4 grid-rows-7 gap-0.5 p-1 h-full">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div key={i} className="bg-primary/40 rounded-[2px] border border-primary/50" />
                    ))}
                  </div>
                </div>
                {/* Obstacles (red) */}
                <div className="absolute top-[20%] right-[10%] w-[15%] h-[12%] border-2 border-status-red bg-status-red/20 rounded-md" />
                <div className="absolute bottom-[15%] left-[15%] w-[10%] h-[10%] border-2 border-status-red bg-status-red/20 rounded-md" />
              </>
            )}
            <div className="absolute bottom-2 left-2 flex gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-status-green/30 status-green">Usable</span>
              <span className="px-2 py-0.5 rounded bg-status-red/30 status-red">Obstacle</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard title="Usable Roof Area" value={solarMetrics.usableArea} unit="m²" />
            <MetricCard title="Number of Panels" value={solarMetrics.numberOfPanels} />
            <MetricCard title="System Capacity" value={solarMetrics.systemCapacity} unit="kW" />
            <MetricCard title="Daily Generation" value={solarMetrics.dailyGeneration} unit="kWh" />
            <MetricCard title="Annual Generation" value={solarMetrics.annualGeneration.toLocaleString()} unit="kWh" />
          </div>

          {/* Financial cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="Total Cost" value={`₹${(financialData.totalCost / 1000).toFixed(0)}K`} variant="orange" />
            <MetricCard title="Annual Savings" value={`₹${(financialData.annualSavings / 1000).toFixed(0)}K`} variant="green" />
            <MetricCard title="Payback Period" value={financialData.paybackPeriod} unit="years" variant="green" />
            <MetricCard title="25-Year Profit" value={`₹${financialData.twentyFiveYearProfit}`} unit="lakhs" variant="green" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cumulative savings */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Cumulative Savings (25 Years)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cumulativeSavings}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Cumulative"]}
                />
                <Bar dataKey="cumulative" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Cost Breakdown</h3>
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
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
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
            <p className="text-xs text-muted-foreground">CO₂ Avoided per Year</p>
            <p className="text-xl font-bold text-foreground">{co2Data.kgAvoided.toLocaleString()} kg</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-green/10 flex items-center justify-center">
            <TreePine className="w-5 h-5 text-status-green" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Equivalent Trees Planted</p>
            <p className="text-xl font-bold text-foreground">{co2Data.treesEquivalent}</p>
          </div>
        </div>
        <div className="ml-auto">
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF Report
          </Button>
        </div>
      </div>
    </div>
  );
}
