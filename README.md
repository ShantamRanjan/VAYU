<div align="center">

<img src="https://img.shields.io/badge/VAYU-Solar%20%26%20Wind%20AI%20Platform-6366f1?style=for-the-badge&logo=lightning&logoColor=white" alt="VAYU" />

# ⚡ VAYU — Solar & Wind Energy Intelligence Platform

**AI-powered rooftop solar analysis · Wind turbine monitoring · Multi-agent energy chatbot**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Seg-FF6B35?style=flat-square)](https://ultralytics.com)
[![LightGBM](https://img.shields.io/badge/LightGBM-Gradient%20Boost-2ECC71?style=flat-square)](https://lightgbm.readthedocs.io)
[![Groq](https://img.shields.io/badge/Groq-llama--3.1--8b-F97316?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 🌟 What is VAYU?

**VAYU** (Sanskrit: *Wind*) is a full-stack renewable energy intelligence platform built for India's energy sector. It combines computer vision, machine learning, and multi-agent AI to give rooftop solar feasibility reports and real-time wind turbine analytics — all in a beautiful, bilingual (English & Kannada) dashboard.

```
Upload a rooftop photo  →  AI segments usable area  →  Get full solar ROI report
Monitor wind farms      →  Agents detect anomalies    →  Alerts with SHAP explanations
Ask the AI chatbot      →  3 specialist agents debate  →  Authoritative energy answer
```

---

## 🗺️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VAYU Platform                            │
├──────────────────────┬──────────────────────────────────────────┤
│   Frontend (React)   │         Backend Services                 │
│                      │                                          │
│  ┌────────────────┐  │  ┌─────────────┐   ┌──────────────────┐ │
│  │  Solar Upload  │──┼─▶│ Flask API   │──▶│  YOLOv8-Seg      │ │
│  │  & Results     │  │  │  (port 5000)│   │  Rooftop Vision  │ │
│  ├────────────────┤  │  ├─────────────┤   ├──────────────────┤ │
│  │  Wind Forecast │──┼─▶│ Layer 3     │──▶│  LightGBM        │ │
│  │  Wind Alerts   │  │  │  AI Agents  │   │  MW Prediction   │ │
│  │  Wind Accuracy │  │  ├─────────────┤   ├──────────────────┤ │
│  ├────────────────┤  │  │ Chatbot API │──▶│  Groq LLM        │ │
│  │  AI Chatbot    │──┼─▶│  (port 5001)│   │  llama-3.1-8b    │ │
│  └────────────────┘  │  └─────────────┘   └──────────────────┘ │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## ✨ Features

### ☀️ Solar Intelligence
| Feature | Description |
|---|---|
| **Rooftop Segmentation** | YOLOv8-Seg model trained on 800+ aerial images detects usable roof area |
| **Solar Feasibility Report** | Panel count, system kW, daily/annual kWh, capacity factor |
| **Indian Financial Analysis** | Total investment, payback period, 25-year profit in ₹ Indian format |
| **PDF Download** | One-click download of complete solar analysis report |
| **Multi-rooftop Batch** | Analyses multiple detected rooftops and aggregates results |

### 🌬️ Wind Intelligence
| Feature | Description |
|---|---|
| **24h Probabilistic Forecast** | P10 / P50 / P90 wind speed bands across multiple stations |
| **Smart Alert System** | Critical / Warning / Normal classification with risk thresholds |
| **Model Accuracy Tracking** | 30-day MAPE trend with automatic drift detection |
| **SHAP Explanations** | Feature importance for every wind power prediction |
| **Interactive Map** | Leaflet map with wind station markers |

### 🤖 AI Chatbot (Multi-Agent Debate)
| Agent | Role |
|---|---|
| **Dr. Solar** | 20-year solar PV expert — calculates sizing, efficiency, LCOE |
| **Dr. Windward** | Wind turbine engineer — Betz law, capacity factors, AEP |
| **Dr. Synthesis** | Senior consultant — merges both experts into one authoritative answer |

> Responses in **~5–8 seconds** using parallel Groq inference on `llama-3.1-8b-instant`

### 🌐 Multilingual
- Full **English ↔ Kannada** toggle across every page
- 90+ translation keys covering all UI text, labels, and alerts

---

## 📁 Project Structure

```
AI for bharat/
│
├── 📂 solar-wind-energy-prediction/     # React + TypeScript Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx             # Landing page with module cards
│   │   │   ├── SolarUpload.tsx          # Rooftop image upload & analysis
│   │   │   ├── SolarResults.tsx         # Solar report with financials
│   │   │   ├── WindForecast.tsx         # 24h probabilistic wind chart
│   │   │   ├── WindAlerts.tsx           # Alert log with filter tabs
│   │   │   ├── WindAccuracy.tsx         # MAPE chart + drift detection
│   │   │   └── WindMap.tsx              # Interactive station map
│   │   ├── components/
│   │   │   ├── Navbar.tsx               # Top bar with live alert notifications
│   │   │   ├── AppSidebar.tsx           # Collapsible navigation sidebar
│   │   │   ├── Chatbot.tsx              # Floating AI chatbot panel
│   │   │   └── MetricCard.tsx           # Reusable KPI card component
│   │   ├── hooks/
│   │   │   ├── useVayuApi.ts            # All backend API hooks (React Query)
│   │   │   └── useTranslation.ts        # i18n hook with interpolation
│   │   └── lib/
│   │       └── translations.ts          # 90+ EN + Kannada translation strings
│   └── package.json
│
├── 📂 vayu_backend/                     # Flask REST API (port 5000)
│   ├── app.py                           # Main API entry point (11 endpoints)
│   ├── solar_engine.py                  # YOLOv8 inference + financial engine
│   ├── requirements.txt                 # Python dependencies
│   └── agents/
│       ├── risk_agent.py                # Wind risk scoring
│       ├── anomaly_agent.py             # Anomaly detection with alerts
│       ├── learning_agent.py            # MAPE tracking + drift detection
│       ├── shap_agent.py                # SHAP feature importance
│       ├── audit_agent.py               # PDF audit brief generator
│       ├── wind_agent.py                # Wind forecast simulation
│       └── orchestrator.py              # Master pipeline coordinator
│
├── 📂 vayu_layer3/                      # Standalone Layer 3 agent scripts
│   ├── orchestrator.py
│   ├── risk_agent.py
│   ├── anomaly_agent.py
│   ├── learning_agent.py
│   ├── shap_agent.py
│   ├── audit_agent.py
│   └── wind_agent.py
│
├── 📄 chatbot_server.py                 # Multi-agent chatbot API (port 5001)
├── 📄 vayu_rooftop_solar_v2.ipynb       # Model training notebook
├── 📄 Solar_Wind_AI_Chatbot.ipynb       # Chatbot development notebook
├── 📄 start_vayu.bat                    # Windows one-click launcher
├── 📄 start_vayu.ps1                    # PowerShell launcher
└── 📄 data.yaml                         # YOLO dataset config
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Backend & ML |
| Node.js | 18+ | Frontend |
| npm | 9+ | Package manager |
| Git | any | Version control |

You'll also need:
- A **Groq API key** (free at [console.groq.com](https://console.groq.com)) for the chatbot
- The **YOLOv8 weights file** `yolo26m-seg.pt` (see [Model Weights](#-model-weights))

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/HarshitTandon22/VAYU.git
cd VAYU
```

---

### Step 2 — Set Up the Python Backend

```bash
# Create and activate a virtual environment
python -m venv venv

# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate

# Install all Python dependencies
pip install -r vayu_backend/requirements.txt
```

> **Note:** Installing `torch`, `ultralytics`, and `lightgbm` may take a few minutes.

---

### Step 3 — Configure Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Then edit `chatbot_server.py` line 11 to load from env if preferred:
```python
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_key_here")
```

---

### Step 4 — Start the Backend Services

You need **two** Python servers running simultaneously.

**Terminal 1 — Main Flask API (Solar + Wind data)**
```bash
cd vayu_backend
python app.py
# ✅ Running on http://localhost:5000
```

**Terminal 2 — Chatbot API (Multi-agent LLM)**
```bash
# From project root
python chatbot_server.py
# ✅ Running on http://localhost:5001
```

> Or use the one-click launcher: **double-click `start_vayu.bat`** (Windows)

---

### Step 5 — Set Up the Frontend

```bash
cd solar-wind-energy-prediction

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
# ✅ Open http://localhost:8080
```

---

### Step 6 — Open the App

Navigate to **[http://localhost:8080](http://localhost:8080)** in your browser.

```
☀️  Solar Module  →  http://localhost:8080/solar/upload
🌬️  Wind Module   →  http://localhost:8080/wind/forecast
🤖  AI Chatbot    →  floating button (bottom-right corner)
```

---

## 🔌 API Reference

### Main Backend — `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/solar/analyze` | Analyze rooftop image → solar report |
| `GET` | `/api/wind/forecast` | 24h P10/P50/P90 forecast per station |
| `GET` | `/api/wind/alerts` | Wind anomaly alerts log |
| `GET` | `/api/wind/accuracy` | MAPE score + drift detection |
| `POST` | `/api/agents/risk` | Wind risk score for given readings |
| `POST` | `/api/agents/anomaly` | Anomaly detection on plant readings |
| `POST` | `/api/agents/shap` | SHAP feature importance analysis |
| `GET` | `/api/agents/learning` | Learning agent 10-day summary |
| `POST` | `/api/agents/audit` | Generate PDF audit brief |
| `GET` | `/api/orchestrator/run` | Run full Layer 3 pipeline |

### Chatbot API — `http://localhost:5001`

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/chat` | `{"question": "..."}` | Ask the multi-agent solar/wind chatbot |
| `GET` | `/health` | — | Health check |

**Example chatbot request:**
```bash
curl -X POST http://localhost:5001/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How many solar panels do I need for a 5kW system in Bangalore?"}'
```

---

## 🧠 How the AI Works

### Solar Rooftop Analysis Pipeline

```
User uploads image
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  1. PREPROCESSING                                    │
│     OpenCV resize → normalize → tensor              │
├─────────────────────────────────────────────────────┤
│  2. YOLOV8 SEGMENTATION  (yolo26m-seg.pt)           │
│     Detects rooftop polygons → pixel masks           │
├─────────────────────────────────────────────────────┤
│  3. USABLE AREA HEURISTIC                           │
│     Otsu brightness centroid → removes shade/HVAC   │
├─────────────────────────────────────────────────────┤
│  4. SOLAR ENGINE  (solar_engine.py)                 │
│     kW = area × GHI × efficiency / 1000            │
│     Annual kWh = kW × 5.5 peak_hours × 365 × PR   │
│     Payback = total_cost / annual_savings           │
├─────────────────────────────────────────────────────┤
│  5. FINANCIAL REPORT                                │
│     Indian ₹ format, 25-year profit, LCOE           │
└─────────────────────────────────────────────────────┘
```

### Wind Intelligence Pipeline (Layer 3 Agents)

```
Wind Sensor Data
       │
       ├──▶ RiskScoreAgent      → risk score (0–100) + severity label
       ├──▶ AnomalyDetectorAgent → Isolation Forest → anomaly alerts
       ├──▶ LearningAgent        → MAPE tracking, drift detection
       ├──▶ SHAPExplainerAgent   → feature importance per prediction
       └──▶ AuditAgent           → PDF audit brief (ReportLab)
            │
            ▼
       Orchestrator → aggregates all outputs → single JSON response
```

### Chatbot Multi-Agent Debate

```
User Question
      │
      ├─── [Parallel] ──▶ Dr. Solar   (solar PV expert, 600 tokens)
      │                ──▶ Dr. Windward (wind engineer, 600 tokens)
      │
      └──▶ Dr. Synthesis  (merges both → final answer, 1200 tokens)
                │
                ▼
           Response in ~5–8 seconds
```

---

## 🏋️ Model Weights

The YOLO segmentation model was trained on **800+ aerial rooftop images** sourced from Roboflow.

| File | Size | Description |
|---|---|---|
| `yolo26m-seg.pt` | ~52 MB | Primary segmentation model (medium) |
| `yolo26n.pt` | ~6 MB | Nano detection model |

Training configuration is in `data.yaml`. To retrain:

```bash
# Open the training notebook
jupyter notebook vayu_rooftop_solar_v2.ipynb
```

The notebook covers:
1. Dataset download from Roboflow
2. YOLOv8 fine-tuning with custom hyperparameters
3. mAP@50 evaluation
4. Exporting the `.pt` weights

---

## 🖥️ Frontend Pages

| Page | Route | Description |
|---|---|---|
| Home | `/` | Platform overview with module cards |
| Solar Upload | `/solar/upload` | Drag-and-drop rooftop image upload |
| Solar Results | `/solar/results` | Full solar feasibility report |
| Wind Forecast | `/wind/forecast` | 24h probabilistic wind chart |
| Wind Alerts | `/wind/alerts` | Alert log with Critical/Warning/Normal filters |
| Wind Accuracy | `/wind/accuracy` | MAPE score, drift detection, 30-day trend |
| Wind Map | `/wind/map` | Interactive Leaflet station map |

---

## 🌐 Multilingual Support

Toggle between **English** and **ಕನ್ನಡ (Kannada)** using the language switcher in the top navbar. All 90+ UI strings are translated, including:

- Navigation labels and sidebar links
- Dashboard KPI titles and descriptions
- Alert banners and status messages
- Chart axis labels and tooltips
- Financial card labels and Indian currency formatting

To add a new language, extend `solar-wind-energy-prediction/src/lib/translations.ts`:

```typescript
const translations: Record<string, Record<string, string>> = {
  en: {
    "home.title": "VAYU Energy Platform",
    // ... 90+ keys
  },
  kn: {
    "home.title": "ವಾಯು ಇಂಧನ ವೇದಿಕೆ",
    // ... Kannada translations
  },
  // Add your language here:
  hi: {
    "home.title": "वायु ऊर्जा मंच",
    // ...
  }
};
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui + Radix UI | Accessible component library |
| Recharts | Solar & wind data charts |
| React Leaflet | Interactive wind station map |
| TanStack Query | API data fetching & caching |
| React Router v6 | Client-side routing |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Flask 3.0 | REST API framework |
| YOLOv8 (Ultralytics) | Rooftop segmentation |
| OpenCV | Image preprocessing |
| LightGBM | Wind power prediction |
| SHAP | Model explainability |
| MAPIE | Conformal prediction intervals |
| scikit-learn | Anomaly detection (Isolation Forest) |
| ReportLab | PDF audit report generation |
| Groq SDK | LLM inference (chatbot) |

---

## ⚡ Performance

| Metric | Value |
|---|---|
| Solar analysis (image → report) | ~3–6 seconds |
| Wind forecast API | ~200ms |
| Chatbot response time | ~5–8 seconds |
| YOLOv8 inference | ~1–2 seconds |
| Frontend bundle size | ~2.1 MB |

The chatbot achieves sub-8s responses by:
1. Running solar + wind experts **in parallel** (ThreadPoolExecutor)
2. Using **`llama-3.1-8b-instant`** (~250 tokens/second on Groq)
3. Limiting expert tokens to 600 (synthesis: 1200)
4. Eliminating the critic agent from the pipeline

---

## 🔧 Development

### Running Tests

```bash
# Frontend type check
cd solar-wind-energy-prediction
npm run build        # TypeScript compile check

# Backend health check
curl http://localhost:5000/api/health
curl http://localhost:5001/health
```

### Building for Production

```bash
cd solar-wind-energy-prediction
npm run build
# Output in solar-wind-energy-prediction/dist/
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key for chatbot LLM |
| `FLASK_ENV` | No | Set to `production` for prod deployment |

---

## 📊 Solar Calculation Reference

Key formulas used in `solar_engine.py`:

```
Energy Output (kWh/day)  = Panel_W × Peak_Sun_Hours × System_Efficiency
System Size (kW)         = Daily_kWh / (Peak_Sun_Hours × Performance_Ratio)
Number of Panels         = ⌈System_W / Panel_W⌉
Annual Output (kWh)      = System_kW × 5.5 × 0.80 × 365
Temperature Correction   = P_rated × [1 + Tc × (T_cell − 25)]   (Tc ≈ −0.0035/°C)
LCOE (₹/kWh)            = NPV_total_cost / Total_lifetime_kWh
Payback (years)          = Total_Cost / Annual_Savings
Annual Degradation       = Output₀ × (1 − 0.005)ᴺ
```

Key wind formulas used in `vayu_layer3/`:

```
Wind Power  P = 0.5 × ρ × A × v³ × Cp
              ρ = 1.225 kg/m³  (sea level)
              A = π × r²       (swept area)
              Cp ≤ 0.593       (Betz limit; typical 0.35–0.45)
AEP (kWh)     = CF × P_rated_kW × 8760
Wind Shear    v₂ = v₁ × (h₂/h₁)^0.14
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for India's renewable energy future**

*VAYU — because clean energy deserves intelligent infrastructure*

</div>
