"""
Gamification awarding service.

Central place where domain events (a workout finished, a streak reached) translate
into XP, achievements and badges. Returns the list of newly-unlocked achievements so
callers can surface celebration UI.
"""
from __future__ import annotations

from .models import Achievement, UserAchievement, GamificationProfile


def _profile(user) -> GamificationProfile:
    profile, _ = GamificationProfile.objects.get_or_create(user=user)
    return profile


def add_xp(user, amount: int) -> GamificationProfile:
    profile = _profile(user)
    profile.xp += amount
    profile.save(update_fields=["xp"])
    return profile


def _unlock(user, achievement: Achievement, newly: list) -> None:
    obj, created = UserAchievement.objects.get_or_create(
        user=user, achievement=achievement
    )
    if created:
        add_xp(user, achievement.xp_reward)
        newly.append(achievement)


def evaluate_achievements(user) -> list[Achievement]:
    """Re-check all threshold achievements against the user's current stats."""
    from apps.fitness.models import WorkoutSession, DailyCheckin
    from apps.fitness.services import compute_streak

    newly: list[Achievement] = []

    completed_workouts = WorkoutSession.objects.filter(
        user=user, status=WorkoutSession.Status.COMPLETED
    ).count()
    checkin_count = DailyCheckin.objects.filter(user=user).count()
    streak = compute_streak(
        list(DailyCheckin.objects.filter(user=user).values_list("date", flat=True))
    )

    # Weight lost = first recorded weight minus latest.
    weights = list(
        DailyCheckin.objects.filter(user=user, weight_kg__isnull=False)
        .order_by("date")
        .values_list("weight_kg", flat=True)
    )
    weight_lost = (weights[0] - weights[-1]) if len(weights) >= 2 else 0

    metric_for = {
        Achievement.Trigger.FIRST_WORKOUT: completed_workouts,
        Achievement.Trigger.WORKOUTS_COUNT: completed_workouts,
        Achievement.Trigger.STREAK: streak,
        Achievement.Trigger.CHECKINS_COUNT: checkin_count,
        Achievement.Trigger.WEIGHT_LOST: weight_lost,
    }

    for achievement in Achievement.objects.all():
        value = metric_for.get(achievement.trigger, 0)
        if value >= achievement.threshold:
            _unlock(user, achievement, newly)

    return newly


def award_for_workout(user) -> dict:
    """Called when a workout session is completed."""
    add_xp(user, 50)  # base XP for finishing a session
    newly = evaluate_achievements(user)
    return {
        "xp_awarded": 50,
        "unlocked": [
            {"code": a.code, "name": a.name, "xp_reward": a.xp_reward} for a in newly
        ],
    }
