# anomaly_agent.py — VAYU Anomaly Detector Agent

from datetime import datetime

class AnomalyDetectorAgent:
    def __init__(self, drop_threshold=0.30, min_plants=2):
        """
        drop_threshold: if a plant drops >30% from expected, flag it
        min_plants: if this many plants flag simultaneously = CASCADE alert
        """
        self.drop_threshold = drop_threshold
        self.min_plants = min_plants

    def check(self, plant_readings: list):
        """
        plant_readings: list of dicts with keys:
          name, expected_mw, actual_mw, risk_score
        """
        flagged = []

        for plant in plant_readings:
            drop_pct = (plant["expected_mw"] - plant["actual_mw"]) / plant["expected_mw"]
            if drop_pct >= self.drop_threshold:
                flagged.append({
                    "name": plant["name"],
                    "expected_mw": plant["expected_mw"],
                    "actual_mw": plant["actual_mw"],
                    "drop_pct": round(drop_pct * 100, 1),
                    "risk_score": plant["risk_score"]
                })

        total_expected = sum(p["expected_mw"] for p in plant_readings)
        total_actual   = sum(p["actual_mw"]   for p in plant_readings)
        total_drop_mw  = total_expected - total_actual

        if len(flagged) >= self.min_plants:
            alert_level = "CASCADE_CRITICAL"
        elif len(flagged) == 1:
            alert_level = "SINGLE_PLANT_WARNING"
        else:
            alert_level = "NORMAL"

        return {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "alert_level": alert_level,
            "flagged_plants": flagged,
            "total_drop_mw": round(total_drop_mw, 2),
            "action_required": alert_level == "CASCADE_CRITICAL"
        }


if __name__ == "__main__":
    agent = AnomalyDetectorAgent(drop_threshold=0.30, min_plants=2)

    # Scenario 1: Normal operations
    print("=== VAYU Anomaly Detector Agent ===\n")
    print("--- Scenario 1: Normal operations ---")
    normal = [
        {"name": "Pavagada Solar",    "expected_mw": 42, "actual_mw": 40, "risk_score": 2.1},
        {"name": "Chitradurga Wind",  "expected_mw": 28, "actual_mw": 26, "risk_score": 3.4},
        {"name": "Gadag Wind",        "expected_mw": 35, "actual_mw": 33, "risk_score": 2.8},
    ]
    result = agent.check(normal)
    print(f"Alert Level:    {result['alert_level']}")
    print(f"Flagged Plants: {len(result['flagged_plants'])}")
    print(f"Total Drop:     {result['total_drop_mw']} MW")
    print()

    # Scenario 2: Cloud front hits — CASCADE
    print("--- Scenario 2: Cloud front CASCADE (demo scenario) ---")
    cascade = [
        {"name": "Pavagada Solar",      "expected_mw": 42, "actual_mw": 11, "risk_score": 9.2},
        {"name": "Raichur Solar",        "expected_mw": 38, "actual_mw": 9,  "risk_score": 8.7},
        {"name": "Chitradurga Wind",     "expected_mw": 28, "actual_mw": 25, "risk_score": 3.4},
    ]
    result = agent.check(cascade)
    print(f"Alert Level:    {result['alert_level']}")
    print(f"Total Drop:     {result['total_drop_mw']} MW")
    print(f"Action Required: {result['action_required']}")
    print(f"\nFlagged Plants:")
    for p in result['flagged_plants']:
        print(f"  {p['name']}: dropped {p['drop_pct']}% "
              f"({p['expected_mw']} -> {p['actual_mw']} MW) "
              f"| Risk {p['risk_score']}/10")
