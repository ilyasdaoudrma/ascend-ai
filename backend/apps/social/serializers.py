from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Post, Comment, Notification, Challenge, ChallengeParticipant,
    Friendship, ChatRoom, Message, Group, GroupMembership, GroupMessage, ActivityEvent,
)

User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    """Compact author/user card used across the social UI."""
    avatar = serializers.SerializerMethodField()
    accent_color = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "avatar", "accent_color"]

    def get_avatar(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.avatar.url if profile and profile.avatar else None

    def get_accent_color(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.accent_color if profile else "#7c5cff"


class CommentSerializer(serializers.ModelSerializer):
    author = PublicUserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "content", "created_at"]
        read_only_fields = ["author", "created_at"]


class PostSerializer(serializers.ModelSerializer):
    author = PublicUserSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    liked_by_me = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "author", "post_type", "content", "image_url",
            "created_at", "like_count", "comment_count", "liked_by_me",
        ]
        read_only_fields = ["author", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    actor = PublicUserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "kind", "message", "link", "is_read", "actor", "created_at"]


class PublicProfileSerializer(serializers.ModelSerializer):
    """Full public profile page payload."""
    avatar = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "date_joined",
                  "avatar", "banner", "profile", "stats", "is_following"]

    def get_avatar(self, obj):
        return obj.profile.avatar.url if obj.profile.avatar else None

    def get_banner(self, obj):
        return obj.profile.banner.url if obj.profile.banner else None

    def get_profile(self, obj):
        p = obj.profile
        if not p.is_public:
            return {"is_public": False, "bio": "", "country": "", "accent_color": p.accent_color}
        return {
            "is_public": True,
            "bio": p.bio,
            "country": p.country,
            "accent_color": p.accent_color,
            "goal": p.goal,
            "experience": p.experience,
            "weight_kg": p.weight_kg,
        }

    def get_stats(self, obj):
        from apps.fitness.models import WorkoutSession, DailyCheckin
        from apps.fitness.services import compute_streak
        gp = getattr(obj, "gamification", None)
        return {
            "followers": obj.followers.count(),
            "following": obj.following.count(),
            "workouts": WorkoutSession.objects.filter(
                user=obj, status="completed"
            ).count(),
            "xp": gp.xp if gp else 0,
            "level": gp.level if gp else 1,
            "streak": compute_streak(
                list(DailyCheckin.objects.filter(user=obj).values_list("date", flat=True))
            ),
            "achievements": obj.achievements.count(),
        }

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.followers.filter(follower=request.user).exists()


class ChallengeSerializer(serializers.ModelSerializer):
    participant_count = serializers.IntegerField(read_only=True, default=0)
    joined = serializers.BooleanField(read_only=True, default=False)
    my_progress = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = ["id", "title", "slug", "description", "icon", "target_value",
                  "unit", "starts_at", "ends_at", "participant_count", "joined", "my_progress"]

    def get_my_progress(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        part = obj.participants.filter(user=request.user).first()
        return part.progress if part else 0


class FriendshipSerializer(serializers.ModelSerializer):
    from_user = PublicUserSerializer(read_only=True)
    to_user = PublicUserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ["id", "from_user", "to_user", "status", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "content", "is_read", "is_mine", "created_at"]
        read_only_fields = ["sender", "is_read", "created_at"]

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and obj.sender_id == request.user.id)


class ChatRoomSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ["id", "other_user", "last_message", "unread", "updated_at"]

    def _other(self, obj):
        request = self.context.get("request")
        return obj.participants.exclude(id=request.user.id).first() if request else None

    def get_other_user(self, obj):
        other = self._other(obj)
        return PublicUserSerializer(other).data if other else None

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return msg.content if msg else ""

    def get_unread(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()


class GroupSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True, default=0)
    joined = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Group
        fields = ["id", "name", "slug", "description", "icon",
                  "member_count", "joined", "created_at"]
        read_only_fields = ["slug", "created_at"]


class ActivityEventSerializer(serializers.ModelSerializer):
    actor = PublicUserSerializer(read_only=True)

    class Meta:
        model = ActivityEvent
        fields = ["id", "actor", "verb", "text", "created_at"]


class GroupMessageSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = GroupMessage
        fields = ["id", "sender", "content", "is_mine", "created_at"]
        read_only_fields = ["sender", "created_at"]

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and obj.sender_id == request.user.id)
