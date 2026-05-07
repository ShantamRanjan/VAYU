# app.py — VAYU Flask backend
# Wraps:
#   * vayu_layer3 agents (risk, anomaly, learning, SHAP, audit, wind, orchestrator)
#   * vayu_rooftop_solar_v2.ipynb solar inference (extracted to solar_engine.py)
#
# Endpoints (JSON unless noted):
#   GET  /api/health
#   POST /api/solar/analyze              (multipart: image)
#   GET  /api/wind/forecast              -> 24h P10/P50/P90 across stations
#   GET  /api/wind/alerts                -> anomaly_agent output as alert log
#   GET  /api/wind/accuracy              -> learning_agent summary (MAPE)
#   POST /api/agents/risk                {p10, p50, p90, rated_mw?}
#   POST /api/agents/anomaly             {plant_readings: [...]}
#   POST /api/agents/shap                (no body — runs orchestrator demo + SHAP)
#   GET  /api/agents/learning            -> learning agent summary (10-day demo)
#   POST /api/agents/audit               -> generates audit_brief PDF, returns path
#   GET  /api/orchestrator/run           -> run full layer3 pipeline

import os
import sys
import io
import uuid
import time
import logging
import warnings
from pathlib import Path
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename

import numpy as np

warnings.filterwarnings("ignore")

# ── Imports of agents (local copies in vayu_backend/agents) ───────────────
HERE       = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from agents.risk_agent     import RiskScoreAgent
from agents.anomaly_agent  import AnomalyDetectorAgent
from agents.learning_agent import LearningAgent
from agents                import orchestrator as orch
# audit_agent (reportlab) imported lazily inside /api/agents/audit so the API
# can boot even when reportlab is not yet installed.

# Solar engine (lazy-imports cv2/torch/ultralytics so the API can boot without them)
import solar_engine

# ── Flask setup ───────────────────────────────────────────────────────────
from flask.json.provider import DefaultJSONProvider


class NumpyJSONProvider(DefaultJSONProvider):
    """Default jsonify chokes on numpy scalars/arrays — coerce them transparently
    so we don't need to mutate the original agent return shapes."""

    @staticmethod
    def _coerce(o):
        if isinstance(o, (np.bool_,)):
            return bool(o)
        if isinstance(o, np.integer):
            return int(o)
        if isinstance(o, np.floating):
            return float(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        if hasattr(o, "isoformat"):
            return o.isoformat()
        raise TypeError(f"Object of type {type(o).__name__} is not JSON serializable")

    def default(self, o):
        return self._coerce(o)


app = Flask(__name__)
app.json = NumpyJSONProvider(app)
CORS(app)  # allow Vite dev server on a different port

UPLOAD_DIR  = HERE / "uploads"
OUTPUT_DIR  = HERE / "outputs"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB max upload

ALLOWED_IMG = {".jpg", ".jpeg", ".png"}

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("vayu")


# ── Health ────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "service": "vayu-backend",
        "time": datetime.now().isoformat(),
    })


# ── Solar: image upload + analysis ────────────────────────────────────────
@app.post("/api/solar/analyze")
def solar_analyze():
    if "image" not in request.files:
        return jsonify({"error": "Missing 'image' file in multipart form"}), 400
    f = request.files["image"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400

    ext = Path(f.filename).suffix.lower()
    if ext not in ALLOWED_IMG:
        return jsonify({"error": f"Unsupported extension '{ext}'. Use jpg/jpeg/png."}), 400

    safe_name = secure_filename(f.filename)
    fname     = f"{uuid.uuid4().hex}_{safe_name}"
    save_path = UPLOAD_DIR / fname
    f.save(str(save_path))

    try:
        result = solar_engine.analyse_image(str(save_path))
    except RuntimeError as e:
        # Heavy deps missing — return a graceful error so frontend can show toast
        return jsonify({"error": str(e), "code": "DEPS_MISSING"}), 503
    except Exception as e:
        log.exception("Solar analysis failed")
        return jsonify({"error": f"Solar analysis failed: {e}"}), 500

    result["upload_id"] = fname
    return jsonify(result)


# ── Wind: 24h forecast (uses notebook-style P10/P50/P90 series) ───────────
@app.get("/api/wind/forecast")
def wind_forecast():
    """
    Computes a 24-hour P10/P50/P90 wind speed forecast per Karnataka station.
    Tries open-meteo first; if unavailable, returns a deterministic synthetic series
    so the frontend continues to render without UI changes.
    """
    rng = np.random.default_rng(42)
    hours = list(range(24))

    try:
        from agents.wind_agent import fetch_wind_data, WIND_PLANTS
        forecasts = {}
        for plant, info in WIND_PLANTS.items():
            df = fetch_wind_data(info["lat"], info["lon"], days=1).head(24)
            v100 = df["windspeed_100m"].to_numpy()
            forecasts[plant] = [
                {
                    "hour": f"{i:02d}:00",
                    "p10":  round(max(0.0, v100[i] - 4.0), 1),
                    "p50":  round(float(v100[i]), 1),
                    "p90":  round(v100[i] + 5.0, 1),
                }
                for i in range(min(24, len(v100)))
            ]
        if forecasts:
            return jsonify({"source": "open-meteo", "forecasts": forecasts})
    except Exception as e:
        log.warning(f"open-meteo unavailable, falling back to synthetic forecast: {e}")

    # Fallback (mirrors mockData shape exactly, deterministic)
    forecast = []
    for i in hours:
        base = 20 + np.sin(i / 4) * 8 + rng.uniform(0, 3)
        forecast.append({
            "hour": f"{i:02d}:00",
            "p10":  round(base - 4, 1),
            "p50":  round(base, 1),
            "p90":  round(base + 5, 1),
        })
    return jsonify({"source": "synthetic", "forecasts": {"Karnataka": forecast}})


# ── Wind: alerts (uses anomaly_agent) ─────────────────────────────────────
@app.get("/api/wind/alerts")
def wind_alerts():
    agent = AnomalyDetectorAgent(drop_threshold=0.30, min_plants=2)
    cascade = [
        {"name": "Pavagada Solar",   "expected_mw": 42, "actual_mw": 11, "risk_score": 9.2},
        {"name": "Raichur Solar",    "expected_mw": 38, "actual_mw": 9,  "risk_score": 8.7},
        {"name": "Chitradurga Wind", "expected_mw": 28, "actual_mw": 25, "risk_score": 3.4},
        {"name": "Gadag Wind",       "expected_mw": 35, "actual_mw": 33, "risk_score": 2.8},
    ]
    raw = agent.check(cascade)

    # Project to the alert-log shape the frontend already renders
    risk_map = {"CASCADE_CRITICAL": "Critical",
                "SINGLE_PLANT_WARNING": "Warning",
                "NORMAL": "Normal"}
    overall = risk_map.get(raw["alert_level"], "Normal")
    now     = datetime.now()
    alerts  = []
    for i, p in enumerate(raw["flagged_plants"]):
        level = "Critical" if p["risk_score"] >= 8 else ("Warning" if p["risk_score"] >= 5 else "Normal")
        alerts.append({
            "id":        str(i + 1),
            "time":      (now - timedelta(minutes=i * 17)).strftime("%H:%M"),
            "date":      now.strftime("%Y-%m-%d"),
            "location":  p["name"],
            "speed":     round(float(p["actual_mw"]) / 1.2, 1),  # MW -> approx wind m/s for display
            "riskLevel": level,
            "action":    "Auto-call initiated" if level == "Critical" else "SMS alert sent",
            "delivery":  "Delivered",
            "transcript": (
                f"Alert: {p['name']} dropped {p['drop_pct']}% "
                f"({p['expected_mw']} -> {p['actual_mw']} MW). "
                f"Risk score {p['risk_score']}/10. Acknowledge by pressing 1."
            ),
        })

    return jsonify({
        "alerts":      alerts,
        "alert_level": raw["alert_level"],
        "overall":     overall,
        "total_drop_mw": raw["total_drop_mw"],
        "action_required": raw["action_required"],
    })


# ── Wind: accuracy / MAPE (uses learning_agent) ───────────────────────────
@app.get("/api/wind/accuracy")
def wind_accuracy():
    agent = LearningAgent(drift_threshold=15.0)
    rng = np.random.default_rng(42)
    base_date = datetime(2026, 4, 25)

    # 7 well-performing days, 3 drift days (mirrors notebook scenario)
    for i in range(7):
        actual    = rng.uniform(20, 45, 24)
        predicted = actual + rng.normal(0, 2, 24)
        agent.log_day((base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                      list(predicted), list(actual), "Pavagada Solar")
    for i in range(7, 10):
        actual    = rng.uniform(5, 20, 24)
        predicted = rng.uniform(25, 45, 24)
        agent.log_day((base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                      list(predicted), list(actual), "Pavagada Solar")

    s = agent.summary()

    # Yesterday's predicted-vs-actual (24h)
    yesterday = []
    for i in range(24):
        predicted = 45 + np.sin(i / 3) * 15 + rng.uniform(0, 5)
        actual    = predicted + (rng.uniform(0, 1) - 0.5) * 12
        yesterday.append({
            "hour":      f"{i:02d}:00",
            "predicted": round(predicted, 1),
            "actual":    round(actual, 1),
        })

    # 30-day MAPE trend (extend learning history with synthetic earlier days)
    mape30 = []
    for i in range(30):
        if i < len(s["history"]):
            mape30.append({"day": f"Day {i+1}", "mape": s["history"][i]["mape"]})
        else:
            mape30.append({"day": f"Day {i+1}", "mape": round(6 + rng.uniform(0, 8), 1)})

    return jsonify({
        "mapeScore":     s["avg_mape"],
        "drift_alerts":  s["drift_alerts"],
        "retrain_needed": s["retrain_needed"],
        "accuracyData":  yesterday,
        "mape30Day":     mape30,
        "history":       s["history"],
    })


# ── Agents: standalone calls ──────────────────────────────────────────────
@app.post("/api/agents/risk")
def agent_risk():
    body = request.get_json(silent=True) or {}
    try:
        p10 = float(body["p10"]); p50 = float(body["p50"]); p90 = float(body["p90"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Body must include numeric p10, p50, p90"}), 400
    rated = float(body.get("rated_mw", 50))
    return jsonify(RiskScoreAgent(rated_mw=rated).calculate(p10, p50, p90))


@app.post("/api/agents/anomaly")
def agent_anomaly():
    body = request.get_json(silent=True) or {}
    plants = body.get("plant_readings")
    if not isinstance(plants, list) or not plants:
        return jsonify({"error": "plant_readings must be a non-empty list"}), 400
    drop_threshold = float(body.get("drop_threshold", 0.30))
    min_plants     = int(body.get("min_plants", 2))
    agent = AnomalyDetectorAgent(drop_threshold=drop_threshold, min_plants=min_plants)
    return jsonify(agent.check(plants))


@app.post("/api/agents/shap")
def agent_shap():
    """Trains the toy LightGBM model and returns a SHAP explanation for one row.
    Falls back gracefully if shap / lightgbm / ollama are unavailable."""
    try:
        from agents.shap_agent import SHAPExplainerAgent
        model, X_test = orch.train_model()
        agent = SHAPExplainerAgent(model)
        row = X_test.iloc[[0]]
        predicted = float(model.predict(row)[0])
        return jsonify(agent.explain(row, predicted))
    except Exception as e:
        log.exception("SHAP failed")
        return jsonify({"error": f"SHAP unavailable: {e}"}), 503


@app.get("/api/agents/learning")
def agent_learning():
    agent = LearningAgent(drift_threshold=15.0)
    rng = np.random.default_rng(42)
    base_date = datetime(2026, 4, 25)
    for i in range(7):
        actual    = rng.uniform(20, 45, 24)
        predicted = actual + rng.normal(0, 2, 24)
        agent.log_day((base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                      list(predicted), list(actual), "Pavagada Solar")
    for i in range(7, 10):
        actual    = rng.uniform(5, 20, 24)
        predicted = rng.uniform(25, 45, 24)
        agent.log_day((base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                      list(predicted), list(actual), "Pavagada Solar")
    return jsonify(agent.summary())


@app.post("/api/agents/audit")
def agent_audit():
    body = request.get_json(silent=True) or {}
    out_path = OUTPUT_DIR / f"vayu_audit_brief_{int(time.time())}.pdf"
    default_data = {
        "plants": [
            {"name": "Pavagada Solar",   "p10": 5,  "p50": 22, "p90": 38, "risk_score": 6.9, "alert": "HIGH"},
            {"name": "Raichur Solar",    "p10": 6,  "p50": 20, "p90": 35, "risk_score": 8.7, "alert": "CRITICAL"},
            {"name": "Chitradurga Wind", "p10": 18, "p50": 28, "p90": 42, "risk_score": 5.3, "alert": "MEDIUM"},
        ],
        "alert_level":    "CASCADE_CRITICAL",
        "total_drop_mw":  63,
        "flagged_count":  2,
        "shap_explanation": (
            "Pavagada Solar output dropped to 11 MW against an expected 42 MW. "
            "Primary driver: cloud cover spiked to 87% (SHAP=-8.3), reducing GHI below threshold. "
            "Secondary driver: temperature inversion suppressing irradiation recovery."
        ),
        "avg_mape":       5.54,
        "drift_alerts":   3,
        "retrain_needed": True,
    }
    forecast_data = {**default_data, **body}
    try:
        from agents.audit_agent import generate_audit_brief
    except ImportError as e:
        return jsonify({
            "error": f"Audit dependency missing: {e}. Install: pip install reportlab",
            "code": "DEPS_MISSING",
        }), 503
    try:
        generate_audit_brief(forecast_data, output_path=str(out_path))
    except Exception as e:
        log.exception("Audit failed")
        return jsonify({"error": f"Audit failed: {e}"}), 500

    download = request.args.get("download", "0") == "1"
    if download:
        return send_file(str(out_path), as_attachment=True,
                         download_name=out_path.name, mimetype="application/pdf")
    return jsonify({"ok": True, "pdf_path": str(out_path), "filename": out_path.name})


@app.get("/api/orchestrator/run")
def orchestrator_run():
    try:
        return jsonify(orch.run_full_pipeline())
    except Exception as e:
        log.exception("Orchestrator failed")
        return jsonify({"error": str(e)}), 500


# ── Entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    log.info(f"VAYU backend starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
