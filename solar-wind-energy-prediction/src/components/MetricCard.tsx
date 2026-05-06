import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  className?: string;
  variant?: "default" | "green" | "orange" | "red";
}

export function MetricCard({ title, value, unit, icon, className, variant = "default" }: MetricCardProps) {
  const borderColor = {
    default: "border-border/50",
    green: "border-status-green/30",
    orange: "border-status-orange/30",
    red: "border-status-red/30",
  }[variant];

  return (
    <div className={cn("glass-card rounded-xl p-4 animate-fade-in-up", borderColor, className)}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
