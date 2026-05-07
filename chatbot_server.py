import os
import math
from concurrent.futures import ThreadPoolExecutor
from groq import Groq
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = "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"
MODEL = "llama-3.1-8b-instant"   # Groq's fastest — ~250 tokens/s
DEBATE_ROUNDS = 1

client = Groq(api_key=GROQ_API_KEY)

# ── Agent system prompts ─────────────────────────────────────────────────────

AGENT_PROMPTS = {
"solar_expert": """
You are Dr. Solar, a world-class solar energy expert with 20+ years of experience.

SPECIALIZATIONS:
• Photovoltaic (PV) technology: monocrystalline, polycrystalline, thin-film, bifacial
• Solar panel efficiency, degradation rates, temperature coefficients
• Irradiance, peak sun hours, tilt & azimuth optimization
• Grid-tied vs off-grid systems, MPPT, inverters, battery storage
• Solar economics: LCOE, payback period, ROI, net metering

KEY FORMULAS (use these precisely):
  Energy Output (kWh/day)  = Panel_W × Peak_Sun_Hours × System_Efficiency
  System Size (kW)         = Daily_kWh / (Peak_Sun_Hours × Performance_Ratio)
  Number of Panels         = ceil(System_W / Panel_W)
  Annual Output (kWh)      = System_kW × Peak_Sun_Hours × PR × 365
  Temperature correction   : P_actual = P_rated × [1 + Tc × (T_cell − 25)]
                             (Tc ≈ −0.0035/°C mono, −0.004/°C poly)
  LCOE ($/kWh)             = NPV_total_cost / Total_lifetime_kWh
  Payback (years)          = Total_Cost / Annual_Savings
  Annual Degradation       : Output_year_N = Output_0 × (1 − 0.005)^N

RULES:
• ALWAYS show full step-by-step calculations with units.
• System efficiency (Performance Ratio) is typically 75–85%, NOT 100%.
• Account for: inverter loss (~4%), wiring loss (~2%), soiling (~2%), mismatch (~1%).
• ONLY answer questions about solar panels and wind energy.
""",

"wind_expert": """
You are Dr. Windward, a leading wind energy engineer with expertise in turbine design
and wind resource assessment.

SPECIALIZATIONS:
• HAWT & VAWT turbine technology, onshore & offshore wind farms
• Wind resource: Weibull distribution, wind shear, turbulence intensity
• Power curve analysis, capacity factor, wake effects
• Small-scale residential wind systems

KEY FORMULAS (use these precisely):
  Wind Power : P = 0.5 × ρ × A × v³ × Cp
               ρ = 1.225 kg/m³ (sea level, 15°C)
               A = π × r²     (rotor swept area)
               Cp = power coefficient (max 0.593 by Betz Law; typical 0.35–0.45)
  AEP (kWh)  = Capacity_Factor × P_rated_kW × 8760
  Wind Shear : v2 = v1 × (h2/h1)^α   (α ≈ 0.14 open terrain)
  CF         = Actual_Annual_Output / (P_rated × 8760)

RULES:
• ALWAYS show full step-by-step calculations with units.
• State the Betz limit when discussing Cp.
• ONLY answer questions about solar panels and wind energy.
""",

"skeptic_agent": """
You are Dr. Critic, a rigorous energy systems analyst.
Your role in the debate: challenge, verify, and improve the other experts' answers.

ALWAYS CHECK FOR:
• Calculation arithmetic errors (re-check every number)
• Wrong or missing formulas
• Unrealistic assumptions (e.g., 100% system efficiency, ignoring losses)
• Missing real-world factors:
    - Solar: inverter loss, soiling, mismatch, cable losses, shading
    - Wind: wake losses, availability factor, electrical losses, turbulence
• Missing O&M costs in economic calculations
• Safety standards, grid codes, or permitting requirements
• Overly optimistic payback / ROI projections

FORMAT:
List each issue as: ❌ Issue: ... → ✅ Correction: ...
If the answer is fully correct, say: ✅ All calculations verified — no issues found.

Be constructively critical, not dismissive.
ONLY review solar and wind energy content.
""",

"synthesis_agent": """
You are Dr. Synthesis, a senior renewable energy consultant.
You receive a debate transcript and produce the FINAL, authoritative answer.

YOUR REQUIREMENTS:
1. Synthesize the strongest insights from all agents.
2. Resolve disagreements using verified physics and data.
3. Show ALL calculations step-by-step with proper units.
4. State every assumption explicitly.
5. Provide practical, actionable recommendations.
6. Acknowledge honest limitations.

OUTPUT FORMAT (use these exact headers):
## 📋 Summary
## 🧮 Calculations
## 💡 Recommendations
## ⚠️ Important Limitations

If the question is NOT about solar or wind energy, respond ONLY with:
"I specialize exclusively in solar panels and wind energy. Please ask me about those topics."

Be precise. Show every formula. Check every unit.
"""
}

# ── Topic filter ──────────────────────────────────────────────────────────────

KEYWORDS = [
    "solar","photovoltaic","pv","panel","inverter","mppt","irradiance",
    "sun","sunlight","watt","kilowatt","kwh","efficiency","monocrystalline",
    "polycrystalline","thin film","bifacial","off-grid","grid-tied",
    "net metering","wind","turbine","windmill","rotor","blade","wind farm",
    "offshore","onshore","weibull","capacity factor","betz","anemometer",
    "renewable","clean energy","green energy","lcoe","payback","battery",
    "storage","charge controller","peak sun","tilt angle","azimuth",
    "degradation","temperature coefficient","energy production","power output",
    "system size","installation","kw","mw","gw","electricity","generation",
    "levelized","performance ratio","annual output","swept area"
]

def is_on_topic(question: str) -> bool:
    q = question.lower()
    return any(kw in q for kw in KEYWORDS)


def call_agent(agent_id: str, messages: list, temperature: float = 0.2) -> str:
    full_messages = [
        {"role": "system", "content": AGENT_PROMPTS[agent_id]}
    ] + messages
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=full_messages,
            max_tokens=600,       # keep expert answers concise
            temperature=temperature,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"⚠️ Agent error [{agent_id}]: {e}"


def run_debate(question: str) -> dict:
    if not is_on_topic(question):
        return {
            "question": question,
            "on_topic": False,
            "final_answer": (
                "❌ **Out of scope.**\n\n"
                "I specialize exclusively in **solar panels** and **wind energy**.\n\n"
                "You can ask me about:\n"
                "- ☀️ Solar panel sizing, efficiency & calculations\n"
                "- 🌬️ Wind turbine power output & capacity factors\n"
                "- 💰 System costs, ROI, LCOE & payback periods\n"
                "- 🔋 Battery storage, off-grid & grid-tied systems\n"
                "- 🌡️ Temperature effects, degradation & real-world losses"
            )
        }

    base_msg = {
        "role": "user",
        "content": (
            f"Question: {question}\n\n"
            "Give a concise, accurate expert answer with key calculations and units."
        )
    }

    # Step 1 — run both domain experts in parallel (1 network round-trip)
    with ThreadPoolExecutor(max_workers=2) as pool:
        f_solar = pool.submit(call_agent, "solar_expert", [base_msg])
        f_wind  = pool.submit(call_agent, "wind_expert",  [base_msg])
        solar = f_solar.result()
        wind  = f_wind.result()

    # Step 2 — synthesis agent produces the final answer (no critic in the loop)
    full_msgs = [
        {"role": "system", "content": AGENT_PROMPTS["synthesis_agent"]},
        {"role": "user", "content": (
            f"Question: {question}\n\n"
            f"[Solar Expert]:\n{solar}\n\n"
            f"[Wind Expert]:\n{wind}\n\n"
            "Synthesize the best answer now. Be precise and concise."
        )}
    ]
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=full_msgs,
            max_tokens=1200,   # synthesis needs more room
            temperature=0.1,
        )
        final = resp.choices[0].message.content.strip()
    except Exception as e:
        final = f"⚠️ Synthesis error: {e}"

    return {
        "question": question,
        "on_topic": True,
        "final_answer": final
    }


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    question = data.get("question", "").strip()
    if not question:
        return jsonify({"error": "No question provided"}), 400
    result = run_debate(question)
    return jsonify(result), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5001, debug=False)
