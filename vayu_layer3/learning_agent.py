# learning_agent.py — VAYU Self-Improving Learning Agent

import numpy as np
from datetime import datetime, timedelta

class LearningAgent:
    def __init__(self, drift_threshold=15.0):
        """
        drift_threshold: if MAPE goes above this %, trigger retrain alert
        """
        self.drift_threshold = drift_threshold
        self.history = []

    def log_day(self, date, predicted_mw: list, actual_mw: list, plant_name: str):
        """Log one day of forecasts vs actuals and compute MAPE"""
        predicted = np.array(predicted_mw)
        actual    = np.array(actual_mw)

        # Avoid divide by zero
        mask = actual > 0.5
        mape = np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100

        entry = {
            "date": date,
            "plant": plant_name,
            "mape": round(mape, 2),
            "drift_alert": mape > self.drift_threshold
        }
        self.history.append(entry)
        return entry

    def summary(self):
        if not self.history:
            return "No data yet."

        avg_mape = np.mean([h["mape"] for h in self.history])
        alerts   = [h for h in self.history if h["drift_alert"]]

        return {
            "days_tracked": len(self.history),
            "avg_mape": round(avg_mape, 2),
            "drift_alerts": len(alerts),
            "retrain_needed": len(alerts) >= 3,
            "history": self.history
        }


if __name__ == "__main__":
    agent = LearningAgent(drift_threshold=15.0)

    # Simulate 10 days of forecasts vs actuals for Pavagada
    print("=== VAYU Learning Agent ===\n")
    np.random.seed(42)

    base_date = datetime(2026, 4, 25)

    # Days 1-7: model performing well
    for i in range(7):
        actual    = np.random.uniform(20, 45, 24)
        predicted = actual + np.random.normal(0, 2, 24)  # small error
        date      = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        entry     = agent.log_day(date, predicted, actual, "Pavagada Solar")
        print(f"{date} | MAPE: {entry['mape']:5.2f}% | "
              f"Drift: {'⚠️  YES' if entry['drift_alert'] else '✓  NO'}")

    # Days 8-10: weather regime change — model drifts
    for i in range(7, 10):
        actual    = np.random.uniform(5, 20, 24)   # monsoon onset, lower output
        predicted = np.random.uniform(25, 45, 24)  # model still predicts high
        date      = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        entry     = agent.log_day(date, predicted, actual, "Pavagada Solar")
        print(f"{date} | MAPE: {entry['mape']:5.2f}% | "
              f"Drift: {'⚠️  YES' if entry['drift_alert'] else '✓  NO'}")

    summary = agent.summary()
    print(f"\n=== Summary ===")
    print(f"Days tracked:    {summary['days_tracked']}")
    print(f"Avg MAPE:        {summary['avg_mape']}%")
    print(f"Drift alerts:    {summary['drift_alerts']}")
    print(f"Retrain needed:  {summary['retrain_needed']}")