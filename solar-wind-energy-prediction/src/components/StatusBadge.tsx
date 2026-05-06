import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  level: "Normal" | "Warning" | "Critical" | "HIGHLY FEASIBLE" | "MODERATELY FEASIBLE" | "NOT RECOMMENDED";
  className?: string;
}

export function StatusBadge({ level, className }: StatusBadgeProps) {
  const styles = {
    "Normal": "bg-status-green-soft status-green",
    "Warning": "bg-status-orange-soft status-orange",
    "Critical": "bg-status-red-soft status-red",
    "HIGHLY FEASIBLE": "bg-status-green-soft status-green",
    "MODERATELY FEASIBLE": "bg-status-orange-soft status-orange",
    "NOT RECOMMENDED": "bg-status-red-soft status-red",
  }[level];

  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", styles, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full mr-2", {
        "bg-status-green": level === "Normal" || level === "HIGHLY FEASIBLE",
        "bg-status-orange": level === "Warning" || level === "MODERATELY FEASIBLE",
        "bg-status-red": level === "Critical" || level === "NOT RECOMMENDED",
      })} />
      {level}
    </span>
  );
}
