import { useWindData } from "@/hooks/useWindData";
import { StatusBadge } from "@/components/StatusBadge";
import { Navigation, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationKey } from "@/lib/translations";

const getMarkerIcon = (riskLevel: string) => {
  const baseClass = "w-4 h-4 rounded-full border-2 border-white shadow-md";
  let colorClass = "bg-status-green";
  if (riskLevel === "Critical") colorClass = "bg-status-red pulse-red";
  else if (riskLevel === "Warning") colorClass = "bg-status-orange";

  return L.divIcon({
    className: "bg-transparent border-none",
    html: `<div class="${baseClass} ${colorClass}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export default function WindMap() {
  const { locations, isLoading, isError, errors } = useWindData();
  const { t } = useTranslation();

  if (isLoading && locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in-up">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t("map.fetching")}</p>
      </div>
    );
  }

  if (isError && locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in-up text-destructive">
        <AlertCircle className="w-8 h-8 mb-4" />
        <p>{t("map.failed")}</p>
        <p className="text-sm mt-2 text-muted-foreground">{errors.join(", ")}</p>
      </div>
    );
  }

  // Sort locations to show critical ones first in the cards and right panel
  const sortedLocations = [...locations].sort((a, b) => b.riskScore - a.riskScore);
  const topLocations = sortedLocations.slice(0, 3); // Show top 3 highest risk in status cards

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topLocations.map((loc) => (
          <div
            key={loc.id}
            className={`glass-card rounded-xl p-4 border-l-4 ${
              loc.riskLevel === "Critical" ? "border-l-status-red" :
              loc.riskLevel === "Warning" ? "border-l-status-orange" :
              "border-l-status-green"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground text-sm">{loc.name}</h3>
              <StatusBadge level={loc.riskLevel} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${
                loc.riskLevel === "Critical" ? "status-red" :
                loc.riskLevel === "Warning" ? "status-orange" :
                "status-green"
              }`}>
                {loc.windSpeed.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">m/s</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("map.updated")} {format(loc.lastUpdated, "HH:mm:ss")}
            </p>
          </div>
        ))}
      </div>

      {/* Map + Detail panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4 min-h-[500px] relative overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-foreground mb-3 shrink-0">{t("map.title")}</h3>
          
          <div className="flex-grow rounded-xl overflow-hidden mt-2 border border-border">
            <MapContainer 
              center={[14.5, 75.5]} 
              zoom={6.5} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {locations.map((loc) => (
                <Marker 
                  key={loc.id} 
                  position={[loc.lat, loc.lng]} 
                  icon={getMarkerIcon(loc.riskLevel)}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip">
                    <div className="p-1">
                      <p className="font-semibold">{loc.name}</p>
                      <p>{t("map.speed")}: {loc.windSpeed.toFixed(1)} m/s</p>
                      <p>{t("map.risk")}: {t(("risk." + loc.riskLevel) as TranslationKey)}</p>
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right detail panel */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedLocations.map((loc) => (
            <div key={loc.id} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground text-sm">{loc.name}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">{loc.description}</span>
                    <img src={`https://openweathermap.org/img/wn/${loc.icon}.png`} alt={loc.description} className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">{t("map.windSpeed")}</p>
                  <p className="font-mono font-bold text-foreground">{loc.windSpeed.toFixed(1)} m/s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("map.gusts")}</p>
                  <p className="font-mono font-bold text-foreground">{loc.windGust.toFixed(1)} m/s</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Navigation className="w-3.5 h-3.5" style={{ transform: `rotate(${loc.windDeg}deg)` }} />
                  {loc.directionLabel} ({loc.windDeg}&deg;)
                </div>
              </div>

              {/* Risk score bar */}
              <div>
                <p className="text-xs flex justify-between text-muted-foreground mb-1">
                  <span>{t("map.riskScore")}</span>
                  <span>{loc.riskScore}/10</span>
                </p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loc.riskScore >= 7 ? "bg-status-red" :
                      loc.riskScore >= 4 ? "bg-status-orange" :
                      "bg-status-green"
                    }`}
                    style={{ width: `${loc.riskScore * 10}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
