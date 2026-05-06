import { useState } from "react";
import { alertLog } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WindAlerts() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("all");

  const filtered = filterLevel === "all" ? alertLog : alertLog.filter((a) => a.riskLevel === filterLevel);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Alert Log</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["all", "Critical", "Warning", "Normal"].map((level) => (
            <Button
              key={level}
              variant={filterLevel === level ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterLevel(level)}
              className="text-xs capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground"></th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Time</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Location</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Speed</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Risk Level</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Action Taken</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((alert) => (
              <>
                <tr
                  key={alert.id}
                  className="border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                >
                  <td className="p-3">
                    {expandedId === alert.id ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="p-3 font-mono text-foreground">{alert.time}</td>
                  <td className="p-3 text-foreground">{alert.location}</td>
                  <td className="p-3 font-mono text-foreground">{alert.speed} m/s</td>
                  <td className="p-3"><StatusBadge level={alert.riskLevel} /></td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{alert.action}</td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={`text-xs font-medium ${
                      alert.delivery === "Delivered" ? "status-green" :
                      alert.delivery === "Escalated" ? "status-orange" :
                      "text-muted-foreground"
                    }`}>{alert.delivery}</span>
                  </td>
                </tr>
                {expandedId === alert.id && alert.transcript && (
                  <tr key={`${alert.id}-exp`} className="bg-secondary/20">
                    <td colSpan={7} className="p-4">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Transcript:</p>
                      <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg">{alert.transcript}</p>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
