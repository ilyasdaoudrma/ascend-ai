from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.fitness.models import WorkoutSession
from apps.gamification.models import UserAchievement
from .models import Follow, PostLike, Comment, Notification, Post, ActivityEvent


def _name(user):
    return user.full_name or user.email


@receiver(post_save, sender=Follow)
def notify_on_follow(sender, instance, created, **kwargs):
    if created and instance.follower_id != instance.following_id:
        name = instance.follower.full_name or instance.follower.email
        Notification.objects.create(
            recipient=instance.following,
            actor=instance.follower,
            kind=Notification.Kind.FOLLOW,
            message=f"{name} started following you.",
            link=f"/u/{instance.follower.username or ''}",
        )


@receiver(post_save, sender=PostLike)
def notify_on_like(sender, instance, created, **kwargs):
    if created and instance.user_id != instance.post.author_id:
        name = instance.user.full_name or instance.user.email
        Notification.objects.create(
            recipient=instance.post.author,
            actor=instance.user,
            kind=Notification.Kind.LIKE,
            message=f"{name} liked your post.",
            link="/dashboard/feed",
        )


@receiver(post_save, sender=Comment)
def notify_on_comment(sender, instance, created, **kwargs):
    if created and instance.author_id != instance.post.author_id:
        name = instance.author.full_name or instance.author.email
        Notification.objects.create(
            recipient=instance.post.author,
            actor=instance.author,
            kind=Notification.Kind.COMMENT,
            message=f"{name} commented on your post.",
            link="/dashboard/feed",
        )


# ---- Activity feed events ----
@receiver(post_save, sender=Post)
def activity_on_post(sender, instance, created, **kwargs):
    if created:
        ActivityEvent.objects.create(
            actor=instance.author, verb=ActivityEvent.Verb.POST,
            text=f"{_name(instance.author)} shared an update.",
        )


@receiver(post_save, sender=UserAchievement)
def activity_on_achievement(sender, instance, created, **kwargs):
    if created:
        ActivityEvent.objects.create(
            actor=instance.user, verb=ActivityEvent.Verb.ACHIEVEMENT,
            text=f"{_name(instance.user)} unlocked “{instance.achievement.name}”.",
        )


@receiver(post_save, sender=WorkoutSession)
def activity_on_workout(sender, instance, created, **kwargs):
    if not created and instance.status == WorkoutSession.Status.COMPLETED:
        # Avoid duplicates if the session is saved again.
        already = ActivityEvent.objects.filter(
            actor=instance.user, verb=ActivityEvent.Verb.WORKOUT,
            created_at__gte=instance.started_at,
        ).exists()
        if not already:
            ActivityEvent.objects.create(
                actor=instance.user, verb=ActivityEvent.Verb.WORKOUT,
                text=f"{_name(instance.user)} completed a workout.",
            )
