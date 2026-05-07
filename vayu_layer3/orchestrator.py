# orchestrator.py — VAYU Master Orchestrator

from shap_agent import SHAPExplainerAgent
from risk_agent import RiskScoreAgent
from anomaly_agent import AnomalyDetectorAgent
from learning_agent import LearningAgent
from audit_agent import generate_audit_brief

import lightgbm as lgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

FEATURES = ["ghi", "cloud_cover", "temperature", "wind_speed_10m",
            "wind_speed_100m", "wind_direction", "hour", "month",
            "plant_type", "terrain_flag"]

def train_model():
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


if __name__ == "__main__":
    print("=" * 55)
    print("   VAYU ORCHESTRATOR — Layer 3 Full Run")
    print("=" * 55)

    # 1. Train model
    print("\n[1/5] Training forecast model...")
    model, X_test = train_model()
    print("      Done.")

    # 2. SHAP Explainer
    print("\n[2/5] Running SHAP Explainer Agent...")
    shap_agent = SHAPExplainerAgent(model)
    test_row   = X_test.iloc[[0]]
    predicted  = model.predict(test_row)[0]
    shap_result = shap_agent.explain(test_row, predicted)
    print(f"      Predicted: {shap_result['predicted_mw']} MW")
    print(f"      Explanation: {shap_result['explanation'][:120]}...")

    # 3. Risk Score
    print("\n[3/5] Running Risk Score Agent...")
    risk_agent  = RiskScoreAgent(rated_mw=50)
    risk_result = risk_agent.calculate(p10=5, p50=22, p90=38)
    print(f"      Risk Score: {risk_result['risk_score']}/10 [{risk_result['risk_level']}]")

    # 4. Anomaly Detector
    print("\n[4/5] Running Anomaly Detector Agent...")
    anomaly_agent = AnomalyDetectorAgent()
    anomaly_result = anomaly_agent.check([
        {"name": "Pavagada Solar",  "expected_mw": 42, "actual_mw": 11, "risk_score": 9.2},
        {"name": "Raichur Solar",   "expected_mw": 38, "actual_mw": 9,  "risk_score": 8.7},
        {"name": "Chitradurga Wind","expected_mw": 28, "actual_mw": 25, "risk_score": 3.4},
    ])
    print(f"      Alert: {anomaly_result['alert_level']}")
    print(f"      Total drop: {anomaly_result['total_drop_mw']} MW")

    # 5. Learning Agent
    print("\n[5/5] Running Learning Agent...")
    learning_agent = LearningAgent()
    np.random.seed(42)
    for i in range(7):
        actual    = np.random.uniform(20, 45, 24)
        predicted_vals = actual + np.random.normal(0, 2, 24)
        learning_agent.log_day(f"2026-04-{25+i}", predicted_vals, actual, "Pavagada Solar")
    learn_summary = learning_agent.summary()
    print(f"      Avg MAPE: {learn_summary['avg_mape']}%")
    print(f"      Retrain needed: {learn_summary['retrain_needed']}")

    # 6. Generate Audit Brief
    print("\n[+] Generating Audit Brief PDF...")
    generate_audit_brief({
        "plants": [
            {"name": "Pavagada Solar",   "p10": 5,  "p50": 22, "p90": 38,
             "risk_score": risk_result["risk_score"], "alert": risk_result["risk_level"]},
            {"name": "Raichur Solar",    "p10": 6,  "p50": 20, "p90": 35,
             "risk_score": 8.7, "alert": "CRITICAL"},
            {"name": "Chitradurga Wind", "p10": 18, "p50": 28, "p90": 42,
             "risk_score": 5.3, "alert": "MEDIUM"},
        ],
        "alert_level":      anomaly_result["alert_level"],
        "total_drop_mw":    anomaly_result["total_drop_mw"],
        "flagged_count":    len(anomaly_result["flagged_plants"]),
        "shap_explanation": shap_result["explanation"],
        "avg_mape":         learn_summary["avg_mape"],
        "drift_alerts":     learn_summary["drift_alerts"],
        "retrain_needed":   learn_summary["retrain_needed"],
    })

    print("\n" + "=" * 55)
    print("   VAYU Layer 3 — ALL AGENTS COMPLETE")
    print("=" * 55)