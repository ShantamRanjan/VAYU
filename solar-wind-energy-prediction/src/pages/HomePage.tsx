import { Wind, Sun, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-fade-in-up">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Wind className="w-4 h-4" />
          {t("home.badge")}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          {t("home.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("home.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/solar/upload"
          className="group glass-card rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-status-orange/10 flex items-center justify-center mb-4">
            <Sun className="w-6 h-6 text-status-orange" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t("home.solarTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("home.solarDesc")}</p>
          <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
            {t("home.solarBtn")} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/wind/map"
          className="group glass-card rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Wind className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t("home.windTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("home.windDesc")}</p>
          <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
            {t("home.windBtn")} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
