"""
AI Coach recommendation engine.

Defined behind a small provider interface so we can swap the deterministic
rules engine for an LLM (OpenAI, Anthropic, ...) without touching callers.

Each recommendation is a dict:
    {"category": "nutrition|workout|recovery|general",
     "priority": "high|medium|low",
     "title": str, "message": str}
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import timedelta

from django.utils import timezone


class CoachProvider(ABC):
    @abstractmethod
    def recommendations(self, *, user, profile, checkins) -> list[dict]:
        ...


class RulesCoachProvider(CoachProvider):
    """Deterministic, explainable heuristics over recent check-ins."""

    def recommendations(self, *, user, profile, checkins) -> list[dict]:
        recs: list[dict] = []
        recent = list(checkins[:7])  # most-recent first

        if not recent:
            recs.append({
                "category": "general",
                "priority": "high",
                "title": "Log your first check-in",
                "message": "Start by logging today's weight, food and sleep so your "
                           "coach can personalise your plan.",
            })
            return recs

        last = recent[0]

        # --- Protein ---
        if profile and profile.protein_target_g and last.protein_g is not None:
            if last.protein_g < profile.protein_target_g * 0.8:
                recs.append({
                    "category": "nutrition",
                    "priority": "high",
                    "title": "Increase protein today",
                    "message": f"Yesterday you hit {last.protein_g:.0f}g protein vs a "
                               f"{profile.protein_target_g:.0f}g target. Add a protein "
                               "source to each meal today.",
                })

        # --- Sleep (3-day low) ---
        sleeps = [c.sleep_hours for c in recent[:3] if c.sleep_hours is not None]
        if len(sleeps) >= 3 and all(s < 6 for s in sleeps):
            recs.append({
                "category": "recovery",
                "priority": "high",
                "title": "Prioritise recovery",
                "message": "You've slept under 6 hours for 3 days. Take a deload or rest "
                           "day and aim for 8 hours tonight.",
            })

        # --- Weight loss too fast ---
        weights = [(c.date, c.weight_kg) for c in recent if c.weight_kg is not None]
        if len(weights) >= 2:
            (d_new, w_new), (d_old, w_old) = weights[0], weights[-1]
            days = max((d_new - d_old).days, 1)
            weekly_change = (w_new - w_old) / days * 7
            if weekly_change < -1.2:
                recs.append({
                    "category": "nutrition",
                    "priority": "medium",
                    "title": "Slow down weight loss",
                    "message": f"You're losing ~{abs(weekly_change):.1f}kg/week, which risks "
                               "muscle loss. Add ~200 kcal/day to protect lean mass.",
                })

        # --- Water ---
        if profile and profile.water_target_ml and last.water_ml is not None:
            if last.water_ml < profile.water_target_ml * 0.7:
                recs.append({
                    "category": "nutrition",
                    "priority": "low",
                    "title": "Hydrate more",
                    "message": f"Target {profile.water_target_ml/1000:.1f}L of water today — "
                               "keep a bottle nearby.",
                })

        # --- Training consistency ---
        week_ago = timezone.now().date() - timedelta(days=7)
        workouts = sum(1 for c in recent if c.workout_completed and c.date >= week_ago)
        target_days = profile.weekly_training_days if profile else 3
        if workouts < target_days:
            recs.append({
                "category": "workout",
                "priority": "medium",
                "title": "Stay on track with training",
                "message": f"You've trained {workouts}/{target_days} days this week. "
                           "A short full-body session keeps the streak alive.",
            })

        if not recs:
            recs.append({
                "category": "general",
                "priority": "low",
                "title": "You're on track 🎯",
                "message": "Great consistency. Keep hitting your targets and progress will follow.",
            })
        return recs


# Swap this for an LLM-backed provider when ready.
default_provider: CoachProvider = RulesCoachProvider()


def generate_recommendations(user) -> list[dict]:
    profile = getattr(user, "profile", None)
    checkins = user.checkins.all()  # DailyCheckin, ordered -date by Meta
    return default_provider.recommendations(
        user=user, profile=profile, checkins=checkins
    )
