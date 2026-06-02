"""Domain services for the fitness app (scoring, streaks)."""
from __future__ import annotations

from datetime import timedelta


def compute_daily_score(checkin, profile) -> int:
    """
    Compose a 0-100 'daily score' from how well a check-in hit the user's targets.
    Each pillar is weighted; missing data simply contributes 0 for that pillar.
    """
    score = 0.0

    # Protein (30 pts)
    if checkin.protein_g and profile and profile.protein_target_g:
        ratio = min(checkin.protein_g / profile.protein_target_g, 1.0)
        score += 30 * ratio

    # Calories within +/-10% of target (25 pts)
    if checkin.calories and profile and profile.recommended_calories:
        target = profile.recommended_calories
        deviation = abs(checkin.calories - target) / target
        score += 25 * max(0.0, 1.0 - deviation / 0.2)  # full pts within 10%, 0 at 20%+

    # Water (15 pts)
    if checkin.water_ml and profile and profile.water_target_ml:
        score += 15 * min(checkin.water_ml / profile.water_target_ml, 1.0)

    # Sleep (15 pts)
    if checkin.sleep_hours and profile and profile.sleep_target_hours:
        score += 15 * min(checkin.sleep_hours / profile.sleep_target_hours, 1.0)

    # Workout (15 pts)
    if checkin.workout_completed:
        score += 15

    return int(round(min(score, 100)))


def compute_streak(checkins_dates: list) -> int:
    """Given a descending-sorted iterable of dates, return the current day streak."""
    dates = sorted(set(checkins_dates), reverse=True)
    if not dates:
        return 0
    from django.utils import timezone

    today = timezone.now().date()
    # Streak is valid if the most recent check-in is today or yesterday.
    if dates[0] < today - timedelta(days=1):
        return 0
    streak = 1
    for prev, curr in zip(dates, dates[1:]):
        if prev - curr == timedelta(days=1):
            streak += 1
        else:
            break
    return streak
