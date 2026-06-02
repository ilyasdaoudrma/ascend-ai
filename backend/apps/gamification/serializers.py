from rest_framework import serializers

from .models import Achievement, Badge, UserAchievement, GamificationProfile


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ["id", "code", "name", "description", "icon",
                  "trigger", "threshold", "xp_reward"]


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "code", "name", "description", "tier", "icon"]


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ["id", "achievement", "unlocked_at"]


class GamificationProfileSerializer(serializers.ModelSerializer):
    level = serializers.ReadOnlyField()
    xp_into_level = serializers.ReadOnlyField()
    xp_for_next_level = serializers.ReadOnlyField()
    badges = BadgeSerializer(many=True, read_only=True)

    class Meta:
        model = GamificationProfile
        fields = ["xp", "level", "xp_into_level", "xp_for_next_level", "badges"]
