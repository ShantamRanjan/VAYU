import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { accuracyData, mapeScore, mape30Day } from "@/data/mockData";
import { AlertTriangle } from "lucide-react";

export default function WindAccuracy() {
  const driftDetected = mapeScore > 15;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-foreground">Forecast Accuracy Tracker</h1>

      {driftDetected && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-status-red-soft border border-status-red/20">
          <AlertTriangle className="w-5 h-5 text-status-red shrink-0" />
          <div>
            <p className="text-sm font-semibold status-red">Model drift detected — retraining recommended</p>
            <p className="text-xs text-muted-foreground">MAPE exceeds 15% threshold</p>
          </div>
        </div>
      )}

      {/* MAPE display */}
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Mean Absolute Percentage Error (MAPE)</p>
        <p className={`text-6xl font-bold ${mapeScore > 15 ? "status-red" : mapeScore > 10 ? "status-orange" : "status-green"}`}>
          {mapeScore}%
        </p>
        <p className="text-sm text-muted-foreground mt-2">Yesterday's forecast accuracy</p>
      </div>

      {/* Predicted vs Actual */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Predicted MW vs Actual MW (Yesterday)</h3>
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary rounded" /> Predicted</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-green rounded" /> Actual</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} unit=" MW" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--status-green))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 30-day MAPE trend */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">30-Day MAPE Trend</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mape30Day}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} unit="%" domain={[0, 20]} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="mape" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
