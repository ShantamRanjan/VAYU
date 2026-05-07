import sys
import os

# Add project root to path so vayu_backend and chatbot_server are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from vayu_backend.app import app
from chatbot_server import run_debate
from flask import request, jsonify


@app.route("/chat", methods=["POST"])
def chat_endpoint():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()
    if not question:
        return jsonify({"error": "No question provided"}), 400
    return jsonify(run_debate(question)), 200


@app.route("/chatbot_health", methods=["GET"])
def chatbot_health():
    return jsonify({"status": "ok"})


# Vercel expects the WSGI app exported as `handler`
handler = app
