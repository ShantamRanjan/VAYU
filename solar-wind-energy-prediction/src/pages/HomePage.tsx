import { Wind, Sun, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-fade-in-up">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Wind className="w-4 h-4" />
          Intelligent Energy Monitoring
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          VAYU Energy Platform
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          AI-powered solar rooftop analysis and real-time wind risk monitoring for Karnataka's renewable energy infrastructure.
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
          <h2 className="text-xl font-bold text-foreground mb-2">Solar Rooftop Analyzer</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload satellite imagery to analyze rooftop solar potential. Get panel layouts, energy estimates, and financial projections.
          </p>
          <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
            Get Started <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/wind/map"
          className="group glass-card rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Wind className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Wind Risk Monitor</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Real-time wind speed monitoring across Karnataka with automated alerts, call escalation, and forecasting.
          </p>
          <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
            View Dashboard <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
