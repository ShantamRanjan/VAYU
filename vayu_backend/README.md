# VAYU Backend (Flask)

Flask wrapper around:
- **Layer-3 agents** (`vayu_layer3/`) — risk score, anomaly, learning, SHAP, audit, wind, orchestrator. Copied verbatim into `agents/` so the backend is self-contained and the agent logic is untouched.
- **Solar inference pipeline** (`vayu_rooftop_solar_v2.ipynb`) — calculation engine extracted into `solar_engine.py` (verbatim formulas) and exposed as a single `/api/solar/analyze` endpoint that runs YOLO segmentation + per-rooftop solar metrics.

The backend lives **outside** the frontend folder. The frontend (`solar-wind-energy-prediction/`) talks to it over HTTP.

## Folder layout

```
vayu_backend/
├── app.py                # Flask app + all REST endpoints
├── solar_engine.py       # Notebook inference (calculate_solar_metrics, etc.)
├── agents/
│   ├── risk_agent.py     # 1-10 risk score from P10/P50/P90
│   ├── anomaly_agent.py  # Cascade-failure detector
│   ├── learning_agent.py # MAPE / drift tracking
│   ├── shap_agent.py     # SHAP explainer + Ollama (graceful fallback)
│   ├── audit_agent.py    # ReportLab PDF audit brief
│   ├── wind_agent.py     # open-meteo + LightGBM + MAPIE
│   └── orchestrator.py   # Runs the full pipeline
├── uploads/              # Solar image uploads (created at runtime)
├── outputs/              # Generated audit PDFs (created at runtime)
└── requirements.txt
```

## Endpoints

| Method | Path                       | Description                                      |
| ------ | -------------------------- | ------------------------------------------------ |
| GET    | `/api/health`              | Liveness probe                                   |
| POST   | `/api/solar/analyze`       | Multipart `image=...` → rooftop metrics + charts |
| GET    | `/api/wind/forecast`       | 24h P10/P50/P90 per Karnataka station            |
| GET    | `/api/wind/alerts`         | Anomaly-detector cascade output as alert log     |
| GET    | `/api/wind/accuracy`       | Learning-agent MAPE summary + 30-day trend       |
| POST   | `/api/agents/risk`         | `{p10, p50, p90, rated_mw?}`                     |
| POST   | `/api/agents/anomaly`      | `{plant_readings: [...]}`                        |
| POST   | `/api/agents/shap`         | Toy LightGBM + SHAP demo                         |
| GET    | `/api/agents/learning`     | 10-day learning-agent demo                       |
| POST   | `/api/agents/audit`        | Generate `vayu_audit_brief_<ts>.pdf`             |
| GET    | `/api/orchestrator/run`    | Run full Layer-3 pipeline                        |

## Run the backend

From the worktree root (or wherever this folder lives):

```powershell
cd vayu_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Backend listens on `http://localhost:5000`.

The Layer-3 agents need: numpy, pandas, scikit-learn, lightgbm, shap, mapie, reportlab.
The solar inference (only used when an image is uploaded) needs: ultralytics, opencv-python, shapely, torch.
The first solar request loads the YOLO model from `runs/rooftop_seg/weights/best.pt` if present, else the bundled `yolo26m-seg.pt`, else auto-downloads.

The SHAP agent calls Ollama at `http://localhost:11434` (model `llama3`). If Ollama isn't running the agent returns a deterministic fallback string — the API call still succeeds.

## Run the frontend

In a separate terminal:

```powershell
cd solar-wind-energy-prediction
npm install        # only the first time
npm run dev
```

Vite serves on `http://localhost:8080`. The frontend reads the backend URL from the `VITE_VAYU_API` env var, defaulting to `http://localhost:5000`. To override:

```powershell
# solar-wind-energy-prediction/.env
VITE_VAYU_API=http://localhost:5000
```

## End-to-end smoke test

1. Start the backend: `python app.py` → `VAYU backend starting on http://localhost:5000`
2. Hit `http://localhost:5000/api/health` — should return `{"ok": true, ...}`
3. Start the frontend: `npm run dev` → `http://localhost:8080`
4. Open the home page → click **Solar Rooftop Analyzer** → upload a JPG/PNG → click **Analyze Roof**.
   The metrics page now reflects the actual YOLO inference + solar calculations from the notebook.
5. Open **Wind Risk Monitor** → the Forecast / Alerts / Accuracy pages now pull from `/api/wind/*`.

If the backend isn't running, the frontend silently falls back to the original mock data — UI/UX is unchanged either way.
