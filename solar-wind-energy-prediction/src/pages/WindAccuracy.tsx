import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  accuracyData as mockAccuracyData,
  mapeScore as mockMapeScore,
  mape30Day as mockMape30Day,
} from "@/data/mockData";
import { AlertTriangle } from "lucide-react";
import { useWindAccuracyApi } from "@/hooks/useVayuApi";
import { useTranslation } from "@/hooks/useTranslation";

export default function WindAccuracy() {
  const { data: api } = useWindAccuracyApi();
  const { t } = useTranslation();

  const accuracyData = api?.accuracyData?.length ? api.accuracyData : mockAccuracyData;
  const mape30Day = api?.mape30Day?.length ? api.mape30Day : mockMape30Day;
  const mapeScore = typeof api?.mapeScore === "number" ? api.mapeScore : mockMapeScore;
  const driftAlerts = api?.drift_alerts ?? 0;
  const retrainNeeded = api?.retrain_needed === true;
  const driftDetected = driftAlerts > 0 || retrainNeeded;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-foreground">{t("accuracy.title")}</h1>

      {driftDetected && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-status-red-soft border border-status-red/20">
          <AlertTriangle className="w-5 h-5 text-status-red shrink-0" />
          <div>
            <p className="text-sm font-semibold status-red">
              {t("accuracy.driftTitle")}
              {driftAlerts > 0 && " " + t("accuracy.driftAlerts", { count: String(driftAlerts) })}
            </p>
            <p className="text-xs text-muted-foreground">
              {retrainNeeded
                ? t("accuracy.retrainDesc")
                : t("accuracy.driftEventsDesc", { count: String(driftAlerts) })}
            </p>
          </div>
        </div>
      )}

      {/* MAPE display */}
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {t("accuracy.mapeLabel")}
        </p>
        <p className={`text-6xl font-bold ${mapeScore > 15 ? "status-red" : mapeScore > 10 ? "status-orange" : "status-green"}`}>
          {mapeScore}%
        </p>
        <p className="text-sm text-muted-foreground mt-2">{t("accuracy.mapeYesterday")}</p>
      </div>

      {/* Predicted vs Actual */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t("accuracy.predictedVsActual")}</h3>
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary rounded" /> {t("accuracy.predicted")}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-green rounded" /> {t("accuracy.actual")}</span>
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
        <h3 className="text-sm font-semibold text-foreground mb-4">{t("accuracy.mape30Day")}</h3>
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
