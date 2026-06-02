from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify

from .models import User, Profile


def _unique_username(base: str) -> str:
    base = slugify(base) or "athlete"
    candidate = base
    i = 1
    while User.objects.filter(username=candidate).exists():
        i += 1
        candidate = f"{base}{i}"
    return candidate


@receiver(post_save, sender=User)
def create_profile_for_user(sender, instance, created, **kwargs):
    """Every user gets exactly one profile and a public handle."""
    if created:
        Profile.objects.get_or_create(user=instance)
        if not instance.username:
            instance.username = _unique_username(instance.email.split("@")[0])
            instance.save(update_fields=["username"])
