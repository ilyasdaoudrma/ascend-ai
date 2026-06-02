from django.contrib import admin

from .models import (
    Exercise, Workout, WorkoutExercise, WorkoutSession, SetLog,
    Goal, DailyCheckin, Meal,
)


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 1


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("name", "muscle_group", "level", "equipment")
    list_filter = ("muscle_group", "level")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "level", "estimated_minutes")
    list_filter = ("category", "level")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [WorkoutExerciseInline]


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "workout", "status", "started_at", "duration_minutes")
    list_filter = ("status",)


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "goal_type", "current_value", "target_value", "is_completed")
    list_filter = ("goal_type", "is_completed")


@admin.register(DailyCheckin)
class DailyCheckinAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "weight_kg", "daily_score", "workout_completed")
    list_filter = ("workout_completed", "mood")


admin.site.register(SetLog)
admin.site.register(Meal)
