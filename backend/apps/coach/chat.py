"""
Conversational AI Coach (premium).

Provider-agnostic: when an LLM key is configured it calls a real model; otherwise
it returns a context-aware fallback so the feature still works in dev/demo.

Set ONE of these env vars to enable the real chatbot (both use the OpenAI-compatible
chat-completions schema, so the calling code is identical):
    GROQ_API_KEY     (+ optional GROQ_MODEL,   default llama-3.3-70b-versatile)
    OPENAI_API_KEY   (+ optional OPENAI_MODEL, default gpt-4o-mini)

GROQ takes priority if both are set. The call uses the stdlib only (urllib) so no
extra dependency is required.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from .engine import generate_recommendations


def _llm_config() -> dict | None:
    """Return the active provider's endpoint config, or None for fallback."""
    groq = os.getenv("GROQ_API_KEY")
    if groq:
        return {
            "provider": "groq",
            "key": groq,
            "url": "https://api.groq.com/openai/v1/chat/completions",
            "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        }
    openai = os.getenv("OPENAI_API_KEY")
    if openai:
        return {
            "provider": "openai",
            "key": openai,
            "url": "https://api.openai.com/v1/chat/completions",
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        }
    return None


def llm_enabled() -> bool:
    return _llm_config() is not None


def active_provider() -> str:
    cfg = _llm_config()
    return cfg["provider"] if cfg else "fallback"


def _profile_summary(user) -> str:
    p = getattr(user, "profile", None)
    if not p:
        return "No profile yet."
    bits = [
        f"goal={p.goal}", f"experience={p.experience}",
        f"weight={p.weight_kg}kg", f"height={p.height_cm}cm",
        f"calorie_target={p.recommended_calories}", f"protein_target={p.protein_target_g}g",
        f"water_target={p.water_target_ml}ml", f"training_days/week={p.weekly_training_days}",
    ]
    return ", ".join(str(b) for b in bits)


def build_system_prompt(user) -> str:
    name = user.full_name or "the athlete"
    return (
        "You are FitJourney AI Coach, an expert, friendly fitness and nutrition coach. "
        "Give concise, practical, encouraging advice grounded in the user's data. "
        "Never give medical diagnoses; suggest seeing a professional for medical issues. "
        f"User: {name}. Profile → {_profile_summary(user)}. "
        "Keep replies under 150 words unless asked for a full plan."
    )


def _llm_chat(cfg: dict, user, message: str, history: list[dict]) -> str:
    messages = [{"role": "system", "content": build_system_prompt(user)}]
    for turn in history[-8:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if content:
            messages.append({"role": "assistant" if role == "coach" else "user", "content": content})
    messages.append({"role": "user", "content": message})

    body = json.dumps({
        "model": cfg["model"],
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 400,
    }).encode("utf-8")
    req = urllib.request.Request(
        cfg["url"],
        data=body,
        headers={
            "Authorization": f"Bearer {cfg['key']}",
            "Content-Type": "application/json",
            # A non-default UA avoids Cloudflare 1010 blocks on urllib requests.
            "User-Agent": "FitJourneyAI/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()


def _fallback_reply(user, message: str) -> str:
    """Deterministic, data-aware reply when no LLM key is configured."""
    recs = generate_recommendations(user)
    top = recs[0] if recs else None
    p = getattr(user, "profile", None)
    lines = ["Here's what I'd focus on based on your latest data:"]
    if top:
        lines.append(f"• {top['title']} — {top['message']}")
    if p and p.protein_target_g:
        lines.append(f"• Aim for ~{p.protein_target_g:.0f}g protein and ~{p.recommended_calories:.0f} kcal today.")
    lines.append(
        "Ask me anything about your training, nutrition or recovery and I'll tailor it to your plan."
    )
    return "\n".join(lines)


def chat_reply(user, message: str, history: list[dict] | None = None) -> dict:
    history = history or []
    cfg = _llm_config()
    if cfg:
        try:
            reply = _llm_chat(cfg, user, message, history)
            return {"reply": reply, "provider": cfg["provider"]}
        except (urllib.error.URLError, urllib.error.HTTPError, KeyError, TimeoutError):
            pass  # fall through to the safe fallback
    return {"reply": _fallback_reply(user, message), "provider": "fallback"}
