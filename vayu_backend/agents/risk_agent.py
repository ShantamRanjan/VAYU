# risk_agent.py — VAYU Risk Score Agent (1-10)

class RiskScoreAgent:
    def __init__(self, rated_mw=50):
        self.rated_mw = rated_mw

    def calculate(self, p10, p50, p90):
        """
        Risk = how wide the uncertainty band is vs rated capacity
        Wide band = high risk. Narrow band = low risk.
        """
        band_width = p90 - p10
        band_pct = band_width / self.rated_mw  # as % of rated

        # Scale to 1-10
        score = round(1 + (band_pct * 9), 1)
        score = max(1.0, min(10.0, score))  # clamp

        if score <= 3:
            level = "LOW"
        elif score <= 6:
            level = "MEDIUM"
        elif score <= 8:
            level = "HIGH"
        else:
            level = "CRITICAL"

        return {
            "p10": round(p10, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "band_width_mw": round(band_width, 2),
            "risk_score": score,
            "risk_level": level
        }


if __name__ == "__main__":
    agent = RiskScoreAgent(rated_mw=50)

    # Test 3 scenarios
    scenarios = [
        {"name": "Pavagada Solar (clear day)",     "p10": 38.0, "p50": 41.0, "p90": 44.0},
        {"name": "Chitradurga Wind (gusty)",        "p10": 18.0, "p50": 28.0, "p90": 42.0},
        {"name": "Pavagada Solar (cloud front!)",   "p10":  5.0, "p50": 22.0, "p90": 38.0},
    ]

    print("=== VAYU Risk Score Agent ===\n")
    for s in scenarios:
        result = agent.calculate(s["p10"], s["p50"], s["p90"])
        print(f"Plant:       {s['name']}")
        print(f"P10/P50/P90: {result['p10']} / {result['p50']} / {result['p90']} MW")
        print(f"Band width:  {result['band_width_mw']} MW")
        print(f"Risk Score:  {result['risk_score']} / 10  [{result['risk_level']}]")
        print("-" * 50)
