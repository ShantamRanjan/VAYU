import { Wind, Sun, Moon, Bell, Globe, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useWindAlertsApi } from "@/hooks/useVayuApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function Navbar() {
  const { theme, toggleTheme, language, toggleLanguage } = useAppContext();
  const { t } = useTranslation();
  const { data: alertsData } = useWindAlertsApi();

  // Show Critical and Warning alerts from backend
  const activeAlerts = (alertsData?.alerts ?? []).filter(
    (a) => a.riskLevel === "Warning" || a.riskLevel === "Critical"
  );
  const notifCount = activeAlerts.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 bg-card/90 backdrop-blur-xl flex items-center px-4 gap-4">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Wind className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight text-foreground">VAYU</span>
      </NavLink>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1">
        <NavLink
          to="/solar"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          {t("nav.solarAnalysis")}
        </NavLink>
        <NavLink
          to="/wind"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          {t("nav.windMonitor")}
        </NavLink>
      </nav>

      <div className="flex-1" />

      {/* System status */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-status-green" />
        {t("nav.updatedAgo")}
      </div>

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        {language === "en" ? "EN" : "ಕನ್ನಡ"}
      </button>

      {/* Notifications Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Bell className="w-4 h-4" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-status-red text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                {notifCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h4 className="text-sm font-semibold">{t("nav.notifications")}</h4>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{notifCount}</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <div key={alert.id} className="p-4 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors flex gap-3 items-start">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${alert.riskLevel === 'Critical' ? 'bg-status-red pulse-red' : 'bg-status-orange'}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {alert.riskLevel === "Critical"
                        ? t("nav.alertCritical", { location: alert.location, speed: String(alert.speed.toFixed(1)) })
                        : t("nav.alertWarning", { location: alert.location, speed: String(alert.speed.toFixed(1)) })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time} · {alert.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center">
                <AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
                <p>{t("nav.noNotifications")}</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
