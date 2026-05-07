# shap_agent.py — VAYU SHAP Explainer Agent

import pandas as pd
import numpy as np
import requests

FEATURES = ["ghi", "cloud_cover", "temperature", "wind_speed_10m",
            "wind_speed_100m", "wind_direction", "hour", "month",
            "plant_type", "terrain_flag"]

class SHAPExplainerAgent:
    def __init__(self, model):
        import shap
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

        try:
            resp = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": "llama3", "prompt": prompt, "stream": False},
                timeout=15,
            )
            explanation = resp.json()["response"]
        except Exception as e:
            # Graceful fallback if Ollama is not running
            explanation = (
                f"[Ollama unreachable — fallback explanation] "
                f"Forecast {predicted_mw:.1f} MW driven primarily by {top3.iloc[0]['feature']} "
                f"(SHAP={top3.iloc[0]['shap_value']:.2f}, value={top3.iloc[0]['actual_value']:.2f}). "
                f"Secondary driver: {top3.iloc[1]['feature']}."
            )

        return {
            "predicted_mw": round(predicted_mw, 2),
            "top3_drivers": top3.to_dict("records"),
            "explanation": explanation
        }
