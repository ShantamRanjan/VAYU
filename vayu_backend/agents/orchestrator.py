# orchestrator.py — VAYU Master Orchestrator
# (Importable: train_model() returns the LightGBM model + holdout for SHAP / risk demos)

import numpy as np
import pandas as pd

FEATURES = ["ghi", "cloud_cover", "temperature", "wind_speed_10m",
            "wind_speed_100m", "wind_direction", "hour", "month",
            "plant_type", "terrain_flag"]


def train_model():
    import lightgbm as lgb
    from sklearn.model_selection import train_test_split
    np.random.seed(42)
    n = 500
    data = pd.DataFrame({
        "ghi":            np.random.uniform(0, 900, n),
        "cloud_cover":    np.random.uniform(0, 100, n),
        "temperature":    np.random.uniform(20, 42, n),
        "wind_speed_10m": np.random.uniform(2, 18, n),
        "wind_speed_100m":np.random.uniform(4, 25, n),
        "wind_direction": np.random.uniform(0, 360, n),
        "hour":           np.random.randint(0, 24, n),
        "month":          np.random.randint(1, 13, n),
        "plant_type":     np.random.choice([0, 1], n),
        "terrain_flag":   np.random.choice([0, 1], n),
    })
    data["mw_output"] = (
        data["ghi"] * 0.003 - data["cloud_cover"] * 0.08
        - data["temperature"] * 0.1 + data["wind_speed_100m"] * 1.2
        + np.random.normal(0, 2, n)
    ).clip(0, 80)
    X = data[FEATURES]
    y = data["mw_output"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = lgb.LGBMRegressor(n_estimators=200, learning_rate=0.05, random_state=42)
    model.fit(X_train, y_train)
    return model, X_test


def run_full_pipeline():
    """Run the full Layer 3 orchestration and return a summary dict."""
    from .shap_agent import SHAPExplainerAgent
    from .risk_agent import RiskScoreAgent
    from .anomaly_agent import AnomalyDetectorAgent
    from .learning_agent import LearningAgent
    from .audit_agent import generate_audit_brief

    out = {}
    # 1. Train model
    model, X_test = train_model()

    # 2. SHAP
    try:
        shap_agent = SHAPExplainerAgent(model)
        test_row   = X_test.iloc[[0]]
        predicted  = float(model.predict(test_row)[0])
        shap_result = shap_agent.explain(test_row, predicted)
    except Exception as e:
        shap_result = {
            "predicted_mw": 0.0,
            "top3_drivers": [],
            "explanation": f"SHAP unavailable: {e}",
        }
    out["shap"] = shap_result

    # 3. Risk
    risk_agent  = RiskScoreAgent(rated_mw=50)
    out["risk"] = risk_agent.calculate(p10=5, p50=22, p90=38)

    # 4. Anomaly
    anomaly_agent  = AnomalyDetectorAgent()
    out["anomaly"] = anomaly_agent.check([
        {"name": "Pavagada Solar",  "expected_mw": 42, "actual_mw": 11, "risk_score": 9.2},
        {"name": "Raichur Solar",   "expected_mw": 38, "actual_mw": 9,  "risk_score": 8.7},
        {"name": "Chitradurga Wind","expected_mw": 28, "actual_mw": 25, "risk_score": 3.4},
    ])

    # 5. Learning
    learning_agent = LearningAgent()
    np.random.seed(42)
    for i in range(7):
        actual = np.random.uniform(20, 45, 24)
        predicted_vals = actual + np.random.normal(0, 2, 24)
        learning_agent.log_day(f"2026-04-{25+i}", predicted_vals, actual, "Pavagada Solar")
    out["learning"] = learning_agent.summary()

    return out


if __name__ == "__main__":
    summary = run_full_pipeline()
    print("=== VAYU Layer 3 — Pipeline Output ===")
    for k, v in summary.items():
        print(f"\n[{k}]")
        print(v)
