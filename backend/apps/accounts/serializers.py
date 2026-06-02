from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profile
from .services import apply_metrics_to_profile

User = get_user_model()


class BanAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Block login for currently-banned accounts with a clear message."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_currently_banned:
            until = self.user.banned_until.strftime("%Y-%m-%d %H:%M UTC")
            raise serializers.ValidationError(
                f"Your account is banned until {until}."
            )
        return data


class AdminUserSerializer(serializers.ModelSerializer):
    is_banned = serializers.BooleanField(source="is_currently_banned", read_only=True)
    goal = serializers.CharField(source="profile.goal", read_only=True, default="")

    class Meta:
        model = User
        fields = ["id", "email", "username", "full_name", "is_active", "is_staff",
                  "date_joined", "banned_until", "ban_reason", "is_banned", "goal"]


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "gender", "age", "height_cm", "weight_kg", "body_fat_pct",
            "activity_level", "experience", "goal", "weekly_training_days",
            "gym_access", "equipment", "sleep_average_hours", "dietary_preference",
            # computed (read-only)
            "bmi", "bmr", "tdee", "maintenance_calories", "recommended_calories",
            "protein_target_g", "carbs_target_g", "fat_target_g",
            "water_target_ml", "sleep_target_hours",
            # public/customization
            "bio", "country", "accent_color", "avatar", "banner",
            "social_links", "is_public", "onboarding_completed", "is_premium",
        ]
        read_only_fields = [
            "bmi", "bmr", "tdee", "maintenance_calories", "recommended_calories",
            "protein_target_g", "carbs_target_g", "fat_target_g",
            "water_target_ml", "sleep_target_hours", "onboarding_completed",
            "is_premium",
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "full_name", "is_staff",
                  "date_joined", "profile"]
        read_only_fields = ["id", "is_staff", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "full_name", "password", "password_confirm"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class OnboardingSerializer(serializers.ModelSerializer):
    """Accepts onboarding inputs and recomputes/persists targets."""

    class Meta:
        model = Profile
        fields = [
            "gender", "age", "height_cm", "weight_kg", "body_fat_pct",
            "activity_level", "experience", "goal", "weekly_training_days",
            "gym_access", "equipment", "sleep_average_hours", "dietary_preference",
        ]

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        apply_metrics_to_profile(instance)
        instance.onboarding_completed = True
        instance.save()
        return instance
