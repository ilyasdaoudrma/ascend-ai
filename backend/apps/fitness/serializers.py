from rest_framework import serializers

from .models import (
    Exercise, Workout, WorkoutExercise, WorkoutSession, SetLog,
    Goal, DailyCheckin, Meal,
)


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "slug", "muscle_group", "equipment",
                  "level", "description", "video_url"]


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(), source="exercise", write_only=True
    )

    class Meta:
        model = WorkoutExercise
        fields = ["id", "exercise", "exercise_id", "order", "sets", "reps", "rest_seconds"]


class WorkoutSerializer(serializers.ModelSerializer):
    items = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = ["id", "name", "slug", "category", "level", "description",
                  "estimated_minutes", "is_template", "items", "created_at"]


class SetLogSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)
    exercise_muscle = serializers.CharField(source="exercise.muscle_group", read_only=True)

    class Meta:
        model = SetLog
        fields = [
            "id", "exercise", "exercise_name", "exercise_muscle",
            "set_number", "reps", "weight_kg", "completed",
        ]
        read_only_fields = ["exercise"]


class WorkoutSessionSerializer(serializers.ModelSerializer):
    set_logs = SetLogSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutSession
        fields = ["id", "workout", "status", "started_at", "completed_at",
                  "duration_minutes", "total_volume_kg", "notes", "set_logs"]
        read_only_fields = ["started_at", "total_volume_kg"]


class GoalSerializer(serializers.ModelSerializer):
    progress_pct = serializers.ReadOnlyField()

    class Meta:
        model = Goal
        fields = ["id", "goal_type", "title", "target_value", "current_value",
                  "unit", "due_date", "is_completed", "progress_pct", "created_at"]
        read_only_fields = ["is_completed", "created_at"]


class DailyCheckinSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCheckin
        fields = ["id", "date", "weight_kg", "calories", "protein_g", "carbs_g",
                  "fat_g", "water_ml", "sleep_hours", "workout_completed", "mood",
                  "energy_level", "notes", "daily_score", "created_at"]
        read_only_fields = ["daily_score", "created_at"]


class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = ["id", "date", "meal_type", "name", "calories",
                  "protein_g", "carbs_g", "fat_g", "created_at"]
