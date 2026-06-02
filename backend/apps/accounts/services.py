"""
Fitness metric engine.

Pure functions that turn onboarding inputs into BMI / BMR / TDEE / macro / water /
sleep targets. Kept free of Django so it is trivially unit-testable and reusable.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict


ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "athlete": 1.9,
}

# Calorie delta applied to TDEE per goal (kcal/day).
GOAL_CALORIE_DELTA = {
    "weight_loss": -500,
    "fat_loss": -400,
    "lean_bulk": +250,
    "muscle_gain": +400,
    "maintenance": 0,
    "recomposition": -150,
}

# Protein grams per kg of bodyweight per goal.
GOAL_PROTEIN_PER_KG = {
    "weight_loss": 2.0,
    "fat_loss": 2.2,
    "lean_bulk": 2.0,
    "muscle_gain": 2.2,
    "maintenance": 1.8,
    "recomposition": 2.2,
}


@dataclass
class MetricResult:
    bmi: float
    bmr: float
    tdee: float
    maintenance_calories: float
    recommended_calories: float
    protein_target_g: float
    carbs_target_g: float
    fat_target_g: float
    water_target_ml: float
    sleep_target_hours: float

    def as_dict(self) -> dict:
        return asdict(self)


def _round(value: float, ndigits: int = 1) -> float:
    return round(value, ndigits)


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100.0
    return _round(weight_kg / (height_m * height_m))


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor equation."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if gender == "male":
        return _round(base + 5)
    if gender == "female":
        return _round(base - 161)
    # Neutral: average of the two offsets.
    return _round(base - 78)


def compute_metrics(
    *,
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
    goal: str,
    sleep_average_hours: float = 7.0,
    body_fat_pct: float | None = None,
) -> MetricResult:
    bmi = calculate_bmi(weight_kg, height_cm)
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)

    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    tdee = _round(bmr * multiplier)
    maintenance = tdee

    recommended = _round(tdee + GOAL_CALORIE_DELTA.get(goal, 0))
    # Never recommend below a safe floor.
    floor = 1200 if gender == "female" else 1500
    recommended = max(recommended, float(floor))

    protein_g = _round(weight_kg * GOAL_PROTEIN_PER_KG.get(goal, 1.8))
    # Fat at 25% of calories (9 kcal/g).
    fat_g = _round((recommended * 0.25) / 9.0)
    # Remaining calories go to carbs (4 kcal/g).
    remaining = recommended - (protein_g * 4) - (fat_g * 9)
    carbs_g = _round(max(remaining, 0) / 4.0)

    water_ml = _round(weight_kg * 35.0, 0)  # 35 ml per kg
    sleep_target = 8.0 if sleep_average_hours < 7 else 7.5

    return MetricResult(
        bmi=bmi,
        bmr=bmr,
        tdee=tdee,
        maintenance_calories=maintenance,
        recommended_calories=recommended,
        protein_target_g=protein_g,
        carbs_target_g=carbs_g,
        fat_target_g=fat_g,
        water_target_ml=water_ml,
        sleep_target_hours=sleep_target,
    )


def apply_metrics_to_profile(profile) -> "MetricResult | None":
    """Recompute and persist targets on a Profile when inputs are sufficient."""
    required = (profile.weight_kg, profile.height_cm, profile.age)
    if not all(required):
        return None
    result = compute_metrics(
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        age=profile.age,
        gender=profile.gender or "other",
        activity_level=profile.activity_level,
        goal=profile.goal,
        sleep_average_hours=profile.sleep_average_hours or 7.0,
        body_fat_pct=profile.body_fat_pct,
    )
    for field, value in result.as_dict().items():
        setattr(profile, field, value)
    return result
