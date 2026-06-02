from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class MuscleGroup(models.TextChoices):
    CHEST = "chest", "Chest"
    BACK = "back", "Back"
    SHOULDERS = "shoulders", "Shoulders"
    BICEPS = "biceps", "Biceps"
    TRICEPS = "triceps", "Triceps"
    LEGS = "legs", "Legs"
    GLUTES = "glutes", "Glutes"
    CORE = "core", "Core"
    FULL_BODY = "full_body", "Full body"
    CARDIO = "cardio", "Cardio"


class Level(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


class Exercise(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    muscle_group = models.CharField(max_length=20, choices=MuscleGroup.choices)
    equipment = models.CharField(max_length=80, blank=True)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    description = models.TextField(blank=True)
    video_url = models.URLField(blank=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class Workout(models.Model):
    class Category(models.TextChoices):
        PUSH = "push", "Push"
        PULL = "pull", "Pull"
        LEGS = "legs", "Legs"
        UPPER = "upper", "Upper"
        LOWER = "lower", "Lower"
        FULL_BODY = "full_body", "Full body"

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    description = models.TextField(blank=True)
    estimated_minutes = models.PositiveSmallIntegerField(default=45)
    is_template = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="workouts"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("category", "level", "name")

    def __str__(self):
        return self.name


class WorkoutExercise(models.Model):
    """Through model: an exercise prescribed inside a workout template."""

    workout = models.ForeignKey(
        Workout, on_delete=models.CASCADE, related_name="items"
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField(default=0)
    sets = models.PositiveSmallIntegerField(default=3)
    reps = models.CharField(max_length=20, default="8-12")
    rest_seconds = models.PositiveSmallIntegerField(default=90)

    class Meta:
        ordering = ("order",)
        unique_together = ("workout", "exercise", "order")

    def __str__(self):
        return f"{self.workout.name} · {self.exercise.name}"


class WorkoutSession(models.Model):
    """A user actually performing a workout."""

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    workout = models.ForeignKey(
        Workout, on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.IN_PROGRESS
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    total_volume_kg = models.FloatField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-started_at",)

    def __str__(self):
        return f"Session<{self.user_id} {self.workout_id} {self.status}>"


class SetLog(models.Model):
    """A single set logged within a session."""

    session = models.ForeignKey(
        WorkoutSession, on_delete=models.CASCADE, related_name="set_logs"
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    set_number = models.PositiveSmallIntegerField(default=1)
    reps = models.PositiveSmallIntegerField(default=0)
    weight_kg = models.FloatField(default=0)
    completed = models.BooleanField(default=False)

    class Meta:
        ordering = ("exercise_id", "set_number")

    def __str__(self):
        return f"{self.exercise.name} set {self.set_number}"


class Goal(models.Model):
    class GoalType(models.TextChoices):
        WEIGHT = "weight", "Weight target"
        TRAINING_FREQUENCY = "training_frequency", "Training frequency"
        WATER = "water", "Water intake"
        SLEEP = "sleep", "Sleep"
        CUSTOM = "custom", "Custom"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    goal_type = models.CharField(max_length=24, choices=GoalType.choices)
    title = models.CharField(max_length=120)
    target_value = models.FloatField()
    current_value = models.FloatField(default=0)
    unit = models.CharField(max_length=20, blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    @property
    def progress_pct(self) -> float:
        if not self.target_value:
            return 0.0
        return round(min(self.current_value / self.target_value, 1.0) * 100, 1)

    def __str__(self):
        return self.title


class DailyCheckin(models.Model):
    class Mood(models.TextChoices):
        GREAT = "great", "Great"
        GOOD = "good", "Good"
        OKAY = "okay", "Okay"
        TIRED = "tired", "Tired"
        BAD = "bad", "Bad"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="checkins")
    date = models.DateField()
    weight_kg = models.FloatField(null=True, blank=True)
    calories = models.PositiveIntegerField(null=True, blank=True)
    protein_g = models.FloatField(null=True, blank=True)
    carbs_g = models.FloatField(null=True, blank=True)
    fat_g = models.FloatField(null=True, blank=True)
    water_ml = models.PositiveIntegerField(null=True, blank=True)
    sleep_hours = models.FloatField(null=True, blank=True)
    workout_completed = models.BooleanField(default=False)
    mood = models.CharField(max_length=10, choices=Mood.choices, blank=True)
    energy_level = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-10
    notes = models.TextField(blank=True)
    daily_score = models.PositiveSmallIntegerField(default=0)  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-date",)
        unique_together = ("user", "date")

    def __str__(self):
        return f"Checkin<{self.user_id} {self.date}>"


class Meal(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="meals")
    date = models.DateField()
    meal_type = models.CharField(max_length=12, choices=MealType.choices)
    name = models.CharField(max_length=120)
    calories = models.PositiveIntegerField(default=0)
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fat_g = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-date", "meal_type")

    def __str__(self):
        return f"{self.meal_type}: {self.name}"
