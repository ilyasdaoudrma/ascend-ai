from django.contrib import admin

from .models import Achievement, Badge, UserAchievement, GamificationProfile


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "trigger", "threshold", "xp_reward")
    list_filter = ("trigger",)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "tier")


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ("user", "achievement", "unlocked_at")


@admin.register(GamificationProfile)
class GamificationProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "xp", "level")
