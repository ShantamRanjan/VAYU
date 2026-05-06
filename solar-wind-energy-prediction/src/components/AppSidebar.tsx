import { NavLink, useLocation } from "react-router-dom";
import { Upload, BarChart3, Map, AlertTriangle, Phone, TrendingUp, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationKey } from "@/lib/translations";

interface SidebarLink {
  to: string;
  labelKey: TranslationKey;
  icon: any;
}

const solarLinks: SidebarLink[] = [
  { to: "/solar/upload", labelKey: "sidebar.upload", icon: Upload },
  { to: "/solar/results", labelKey: "sidebar.results", icon: BarChart3 },
];

const windLinks: SidebarLink[] = [
  { to: "/wind/map", labelKey: "sidebar.liveMap", icon: Map },
  { to: "/wind/alerts", labelKey: "sidebar.alertLog", icon: AlertTriangle },
  { to: "/wind/calls", labelKey: "sidebar.callLog", icon: Phone },
  { to: "/wind/forecast", labelKey: "sidebar.forecast", icon: TrendingUp },
  { to: "/wind/accuracy", labelKey: "sidebar.accuracy", icon: Target },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const isSolar = pathname.startsWith("/solar");
  const isWind = pathname.startsWith("/wind");
  const links = isSolar ? solarLinks : isWind ? windLinks : [];
  const sectionTitleKey: TranslationKey | "" = isSolar ? "sidebar.solarAnalysis" : isWind ? "sidebar.windMonitor" : "";

  if (!links.length) return null;

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border/50 bg-sidebar transition-all duration-200 ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
        {!collapsed && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{sectionTitleKey ? t(sectionTitleKey) : ""}</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-secondary text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 py-2 space-y-0.5 px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`
            }
          >
            <link.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t(link.labelKey)}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
