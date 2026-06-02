from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.follower_id} → {self.following_id}"


class Friendship(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        BLOCKED = "blocked", "Blocked"

    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friendships_sent")
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friendships_received")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_user", "to_user")
        ordering = ("-created_at",)


class Post(models.Model):
    class PostType(models.TextChoices):
        UPDATE = "update", "Personal update"
        PROGRESS = "progress", "Progress photo"
        WEIGHT = "weight", "Weight update"
        ACHIEVEMENT = "achievement", "Achievement unlocked"
        WORKOUT = "workout", "Workout completed"
        MILESTONE = "milestone", "Transformation milestone"

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    post_type = models.CharField(max_length=16, choices=PostType.choices, default=PostType.UPDATE)
    content = models.TextField(blank=True)
    image_url = models.URLField(blank=True)  # external URL keeps free hosting simple
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Post<{self.author_id} {self.post_type}>"


class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user")


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)


class Notification(models.Model):
    class Kind(models.TextChoices):
        FOLLOW = "follow", "New follower"
        LIKE = "like", "Post liked"
        COMMENT = "comment", "New comment"
        FRIEND = "friend", "Friend request"
        CHALLENGE = "challenge", "Challenge"

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    kind = models.CharField(max_length=12, choices=Kind.choices)
    message = models.CharField(max_length=200)
    link = models.CharField(max_length=200, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Notif<{self.recipient_id} {self.kind}>"


class Challenge(models.Model):
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, default="trophy")
    target_value = models.FloatField(default=30)
    unit = models.CharField(max_length=20, default="days")
    starts_at = models.DateField(null=True, blank=True)
    ends_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title


class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="challenges")
    progress = models.FloatField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("challenge", "user")
        ordering = ("-progress",)


class ChatRoom(models.Model):
    """A 1:1 direct-message room. `key` is the sorted user-id pair for de-dup."""
    participants = models.ManyToManyField(User, related_name="chat_rooms")
    key = models.CharField(max_length=40, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)

    @staticmethod
    def make_key(a_id: int, b_id: int) -> str:
        lo, hi = sorted([a_id, b_id])
        return f"{lo}-{hi}"


class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages_sent")
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)


class Group(models.Model):
    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, default="users")
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="groups_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    class Role(models.TextChoices):
        MEMBER = "member", "Member"
        ADMIN = "admin", "Admin"

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="group_memberships")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("group", "user")


class GroupMessage(models.Model):
    """A message in a group chat — only visible to members."""
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="group_messages")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)


class ActivityEvent(models.Model):
    """Lightweight activity log surfaced in the activity feed."""
    class Verb(models.TextChoices):
        WORKOUT = "workout", "completed a workout"
        ACHIEVEMENT = "achievement", "unlocked an achievement"
        STREAK = "streak", "reached a new streak"
        POST = "post", "shared an update"
        JOINED = "joined", "joined a challenge"

    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activity_events")
    verb = models.CharField(max_length=16, choices=Verb.choices)
    text = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
