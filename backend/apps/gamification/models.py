from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Achievement(models.Model):
    """A definition of something a user can unlock."""

    class Trigger(models.TextChoices):
        FIRST_WORKOUT = "first_workout", "First workout"
        WORKOUTS_COUNT = "workouts_count", "Total workouts"
        STREAK = "streak", "Day streak"
        WEIGHT_LOST = "weight_lost", "Weight lost"
        CHECKINS_COUNT = "checkins_count", "Total check-ins"

    code = models.SlugField(max_length=60, unique=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=200)
    icon = models.CharField(max_length=40, default="trophy")
    trigger = models.CharField(max_length=24, choices=Trigger.choices)
    threshold = models.FloatField(default=1)
    xp_reward = models.PositiveIntegerField(default=50)

    class Meta:
        ordering = ("threshold",)

    def __str__(self):
        return self.name


class Badge(models.Model):
    code = models.SlugField(max_length=60, unique=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=200)
    tier = models.CharField(max_length=20, default="bronze")
    icon = models.CharField(max_length=40, default="medal")

    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="achievements")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "achievement")
        ordering = ("-unlocked_at",)

    def __str__(self):
        return f"{self.user_id} unlocked {self.achievement.code}"


class GamificationProfile(models.Model):
    """Per-user XP / level / badge state."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="gamification")
    xp = models.PositiveIntegerField(default=0)
    badges = models.ManyToManyField(Badge, blank=True, related_name="holders")

    @property
    def level(self) -> int:
        # 100 XP for level 2, then each level needs +50 more than the previous.
        level, needed, acc = 1, 100, 0
        while self.xp >= acc + needed:
            acc += needed
            level += 1
            needed += 50
        return level

    @property
    def xp_into_level(self) -> int:
        level, needed, acc = 1, 100, 0
        while self.xp >= acc + needed:
            acc += needed
            level += 1
            needed += 50
        return self.xp - acc

    @property
    def xp_for_next_level(self) -> int:
        level, needed, acc = 1, 100, 0
        while self.xp >= acc + needed:
            acc += needed
            level += 1
            needed += 50
        return needed

    def __str__(self):
        return f"Gamification<{self.user_id} L{self.level} {self.xp}xp>"
