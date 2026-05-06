import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { forecastData, windLocations } from "@/data/mockData";
import { AlertTriangle } from "lucide-react";

export default function WindForecast() {
  const [selectedLocation, setSelectedLocation] = useState(windLocations[0].name);

  const hasCrossing = forecastData.some((d) => d.p50 > 25 || d.p90 > 30);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">24-Hour Wind Forecast</h1>
        <div className="flex gap-2">
          {windLocations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedLocation === loc.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {hasCrossing && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-status-red-soft border border-status-red/20">
          <AlertTriangle className="w-5 h-5 text-status-red shrink-0" />
          <div>
            <p className="text-sm font-semibold status-red">PREDICTED RISK IN 6 HOURS</p>
            <p className="text-xs text-muted-foreground">Wind speed forecast exceeds safety threshold for {selectedLocation}</p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-green rounded" /> P10</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary rounded" /> P50</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-orange rounded" /> P90</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-red rounded border-dashed" /> Thresholds</span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 45]} unit=" m/s" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
              />
              <ReferenceLine y={25} stroke="hsl(var(--status-orange))" strokeDasharray="5 5" label={{ value: "25 m/s", fill: "hsl(var(--status-orange))", fontSize: 10 }} />
              <ReferenceLine y={30} stroke="hsl(var(--status-red))" strokeDasharray="5 5" label={{ value: "30 m/s", fill: "hsl(var(--status-red))", fontSize: 10 }} />
              <Line type="monotone" dataKey="p10" stroke="hsl(var(--status-green))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="p50" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p90" stroke="hsl(var(--status-orange))" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
