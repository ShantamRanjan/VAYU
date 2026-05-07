# shap_agent.py — VAYU SHAP Explainer Agent

import pandas as pd
import numpy as np
import lightgbm as lgb
import shap
import requests
from sklearn.model_selection import train_test_split

FEATURES = ["ghi", "cloud_cover", "temperature", "wind_speed_10m",
            "wind_speed_100m", "wind_direction", "hour", "month",
            "plant_type", "terrain_flag"]

class SHAPExplainerAgent:
    def __init__(self, model):
        self.model = model
        self.explainer = shap.TreeExplainer(model)

    def get_top3(self, X_row: pd.DataFrame):
        shap_vals = self.explainer.shap_values(X_row)[0]
        drivers = pd.DataFrame({
            "feature": FEATURES,
            "shap_value": shap_vals,
            "actual_value": X_row.values[0]
        }).assign(abs_shap=lambda d: d["shap_value"].abs())
        return drivers.sort_values("abs_shap", ascending=False).head(3)

    def explain(self, X_row: pd.DataFrame, predicted_mw: float):
        top3 = self.get_top3(X_row)
        plant = "solar" if X_row["plant_type"].values[0] == 0 else "wind"

        drivers_text = "\n".join([
            f"- {r['feature']}: SHAP={r['shap_value']:.2f}, value={r['actual_value']:.2f}"
            for _, r in top3.iterrows()
        ])

        prompt = f"""You are VAYU, an AI energy forecasting assistant for Karnataka's grid.
A {plant} plant forecasts {predicted_mw:.1f} MW. Top 3 drivers:
{drivers_text}
Write 2 plain English sentences for a grid operator. Be specific. No jargon."""

        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False}
        )
        return {
            "predicted_mw": round(predicted_mw, 2),
            "top3_drivers": top3.to_dict("records"),
            "explanation": resp.json()["response"]
        }


# --- Main ---
if __name__ == "__main__":
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
        data["ghi"] * 0.003
        - data["cloud_cover"] * 0.08
        - data["temperature"] * 0.1
        + data["wind_speed_100m"] * 1.2
        + np.random.normal(0, 2, n)
    ).clip(0, 80)

    X = data[FEATURES]
    y = data["mw_output"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print("Training model...")
    model = lgb.LGBMRegressor(n_estimators=200, learning_rate=0.05, random_state=42)
    model.fit(X_train, y_train)
    print("Model trained. R²:", round(model.score(X_test, y_test), 3))
    agent = SHAPExplainerAgent(model)

    test_row = X_test.iloc[[0]]
    predicted = model.predict(test_row)[0]

    print("\nRunning SHAP + Ollama explanation...")
    result = agent.explain(test_row, predicted)

    print("\n=== VAYU SHAP Explainer Agent Output ===")
    print(f"Predicted MW:  {result['predicted_mw']}")
    print(f"\nTop 3 drivers:")
    for d in result['top3_drivers']:
        print(f"  {d['feature']}: SHAP={d['shap_value']:.2f}, value={d['actual_value']:.2f}")
    print(f"\nExplanation:\n{result['explanation']}")