from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Email-as-username custom user."""

    email = models.EmailField(unique=True)
    username = models.SlugField(
        max_length=30, unique=True, null=True, blank=True,
        help_text="Public handle, e.g. /u/<username>",
    )
    full_name = models.CharField(max_length=120, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    # Moderation
    banned_until = models.DateTimeField(null=True, blank=True)
    ban_reason = models.CharField(max_length=200, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ("-date_joined",)

    def __str__(self):
        return self.email

    @property
    def is_currently_banned(self) -> bool:
        return self.banned_until is not None and self.banned_until > timezone.now()


class Profile(models.Model):
    """Onboarding answers + computed fitness targets."""

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    class ActivityLevel(models.TextChoices):
        SEDENTARY = "sedentary", "Sedentary"
        LIGHT = "light", "Lightly active"
        MODERATE = "moderate", "Moderately active"
        ACTIVE = "active", "Very active"
        ATHLETE = "athlete", "Athlete"

    class Experience(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    class Goal(models.TextChoices):
        WEIGHT_LOSS = "weight_loss", "Weight loss"
        FAT_LOSS = "fat_loss", "Fat loss"
        LEAN_BULK = "lean_bulk", "Lean bulk"
        MUSCLE_GAIN = "muscle_gain", "Muscle gain"
        MAINTENANCE = "maintenance", "Maintenance"
        RECOMPOSITION = "recomposition", "Recomposition"

    class DietaryPreference(models.TextChoices):
        OMNIVORE = "omnivore", "Omnivore"
        VEGETARIAN = "vegetarian", "Vegetarian"
        VEGAN = "vegan", "Vegan"
        PESCATARIAN = "pescatarian", "Pescatarian"
        KETO = "keto", "Keto"
        HALAL = "halal", "Halal"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # --- Onboarding inputs ---
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    body_fat_pct = models.FloatField(null=True, blank=True)
    activity_level = models.CharField(
        max_length=20, choices=ActivityLevel.choices, default=ActivityLevel.MODERATE
    )
    experience = models.CharField(
        max_length=20, choices=Experience.choices, default=Experience.BEGINNER
    )
    goal = models.CharField(
        max_length=20, choices=Goal.choices, default=Goal.MAINTENANCE
    )
    weekly_training_days = models.PositiveSmallIntegerField(default=3)
    gym_access = models.BooleanField(default=True)
    equipment = models.JSONField(default=list, blank=True)
    sleep_average_hours = models.FloatField(default=7.0)
    dietary_preference = models.CharField(
        max_length=20, choices=DietaryPreference.choices, default=DietaryPreference.OMNIVORE
    )

    # --- Computed targets (persisted) ---
    bmi = models.FloatField(null=True, blank=True)
    bmr = models.FloatField(null=True, blank=True)
    tdee = models.FloatField(null=True, blank=True)
    maintenance_calories = models.FloatField(null=True, blank=True)
    recommended_calories = models.FloatField(null=True, blank=True)
    protein_target_g = models.FloatField(null=True, blank=True)
    carbs_target_g = models.FloatField(null=True, blank=True)
    fat_target_g = models.FloatField(null=True, blank=True)
    water_target_ml = models.FloatField(null=True, blank=True)
    sleep_target_hours = models.FloatField(null=True, blank=True)

    # --- Public profile / customization ---
    bio = models.CharField(max_length=280, blank=True)
    country = models.CharField(max_length=60, blank=True)
    accent_color = models.CharField(max_length=9, default="#7c5cff")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    banner = models.ImageField(upload_to="banners/", null=True, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    is_public = models.BooleanField(default=True)

    onboarding_completed = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)  # Pro subscription (AI chat coach)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile<{self.user.email}>"
