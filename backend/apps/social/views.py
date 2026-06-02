from django.contrib.auth import get_user_model
from django.db.models import Count, Exists, OuterRef, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import viewsets, mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.fitness.models import WorkoutSession, DailyCheckin
from apps.fitness.services import compute_streak
from django.utils.text import slugify
from .models import (
    Follow, Post, PostLike, Comment, Notification, Challenge, ChallengeParticipant,
    Friendship, ChatRoom, Message, Group, GroupMembership, GroupMessage, ActivityEvent,
)
from .serializers import (
    PostSerializer, CommentSerializer, NotificationSerializer,
    PublicProfileSerializer, PublicUserSerializer, ChallengeSerializer,
    FriendshipSerializer, ChatRoomSerializer, MessageSerializer,
    GroupSerializer, GroupMessageSerializer, ActivityEventSerializer,
)

User = get_user_model()


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        liked = PostLike.objects.filter(post=OuterRef("pk"), user=user)
        qs = (
            Post.objects.select_related("author", "author__profile")
            .annotate(
                like_count=Count("likes", distinct=True),
                comment_count=Count("comments", distinct=True),
                liked_by_me=Exists(liked),
            )
            .order_by("-created_at")
        )
        scope = self.request.query_params.get("scope", "discover")
        if scope == "following":
            following_ids = Follow.objects.filter(follower=user).values_list("following_id", flat=True)
            qs = qs.filter(Q(author__in=following_ids) | Q(author=user))
        elif scope == "me":
            qs = qs.filter(author=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @extend_schema(parameters=[OpenApiParameter("scope", str, description="discover | following | me")])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
        return Response({"liked": created, "like_count": post.likes.count()})

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "POST":
            serializer = CommentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(post=post, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        comments = post.comments.select_related("author", "author__profile")
        return Response(CommentSerializer(comments, many=True).data)


class SocialUserViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Discover people, view public profiles, follow / unfollow."""
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "username"

    def get_permissions(self):
        # Public profiles are shareable without an account.
        if self.action == "retrieve":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        return (
            User.objects.select_related("profile", "gamification")
            .exclude(id=self.request.user.id)
            .exclude(username__isnull=True)
            .exclude(username="")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PublicProfileSerializer
        return PublicUserSerializer

    def list(self, request, *args, **kwargs):
        """Suggested users (not already followed)."""
        followed = Follow.objects.filter(follower=request.user).values_list("following_id", flat=True)
        users = self.get_queryset().exclude(id__in=followed)[:20]
        return Response(PublicUserSerializer(users, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        user = get_object_or_404(self.get_queryset_all(), username=kwargs["username"])
        return Response(self.get_serializer(user, context={"request": request}).data)

    def get_queryset_all(self):
        # Public profiles are visible even for the requesting user themselves.
        return User.objects.select_related("profile", "gamification")

    @action(detail=True, methods=["post", "delete"])
    def follow(self, request, username=None):
        target = get_object_or_404(User, username=username)
        if target == request.user:
            return Response({"detail": "You cannot follow yourself."}, status=400)
        if request.method == "POST":
            Follow.objects.get_or_create(follower=request.user, following=target)
            return Response({"following": True}, status=status.HTTP_201_CREATED)
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response({"following": False})


class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    CATEGORIES = {"xp", "streak", "workouts"}

    @extend_schema(parameters=[OpenApiParameter("category", str, description="xp | streak | workouts")])
    def get(self, request):
        category = request.query_params.get("category", "xp")
        if category not in self.CATEGORIES:
            category = "xp"

        users = User.objects.select_related("profile", "gamification").filter(is_active=True)
        rows = []
        for user in users:
            gp = getattr(user, "gamification", None)
            if category == "xp":
                value = gp.xp if gp else 0
            elif category == "workouts":
                value = WorkoutSession.objects.filter(user=user, status="completed").count()
            else:  # streak
                value = compute_streak(
                    list(DailyCheckin.objects.filter(user=user).values_list("date", flat=True))
                )
            rows.append({
                "user": PublicUserSerializer(user).data,
                "value": value,
                "level": gp.level if gp else 1,
            })
        rows.sort(key=lambda r: r["value"], reverse=True)
        for i, row in enumerate(rows):
            row["rank"] = i + 1
            row["is_me"] = row["user"]["id"] == request.user.id
        return Response({"category": category, "entries": rows[:50]})


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related(
            "actor", "actor__profile"
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread": count})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"status": "ok"})


class ChallengeViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        joined = ChallengeParticipant.objects.filter(challenge=OuterRef("pk"), user=user)
        return Challenge.objects.annotate(
            participant_count=Count("participants", distinct=True),
            joined=Exists(joined),
        )

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        challenge = self.get_object()
        ChallengeParticipant.objects.get_or_create(challenge=challenge, user=request.user)
        return Response({"joined": True}, status=status.HTTP_201_CREATED)


class FriendshipViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        ).select_related("from_user", "to_user")

    def list(self, request):
        """Accepted friends."""
        friendships = self.get_queryset().filter(status=Friendship.Status.ACCEPTED)
        friends = []
        for f in friendships:
            other = f.to_user if f.from_user_id == request.user.id else f.from_user
            friends.append(PublicUserSerializer(other).data)
        return Response(friends)

    @action(detail=False, methods=["get"])
    def requests(self, request):
        pending = self.get_queryset().filter(
            to_user=request.user, status=Friendship.Status.PENDING
        )
        return Response(FriendshipSerializer(pending, many=True).data)

    @action(detail=False, methods=["post"])
    def request_friend(self, request):
        target = get_object_or_404(User, username=request.data.get("username"))
        if target == request.user:
            return Response({"detail": "You cannot friend yourself."}, status=400)
        friendship, created = Friendship.objects.get_or_create(
            from_user=request.user, to_user=target,
            defaults={"status": Friendship.Status.PENDING},
        )
        if created:
            Notification.objects.create(
                recipient=target, actor=request.user, kind=Notification.Kind.FRIEND,
                message=f"{request.user.full_name or request.user.email} sent you a friend request.",
                link="/dashboard/friends",
            )
        return Response(FriendshipSerializer(friendship).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        friendship = get_object_or_404(self.get_queryset(), pk=pk, to_user=request.user)
        friendship.status = Friendship.Status.ACCEPTED
        friendship.save(update_fields=["status"])
        return Response(FriendshipSerializer(friendship).data)

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        friendship = get_object_or_404(self.get_queryset(), pk=pk, to_user=request.user)
        friendship.delete()
        return Response({"status": "declined"})


class ChatRoomViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.chat_rooms.prefetch_related("participants", "messages")

    @action(detail=False, methods=["post"])
    def open(self, request):
        """Get or create a 1:1 room with another user (by username)."""
        target = get_object_or_404(User, username=request.data.get("username"))
        if target == request.user:
            return Response({"detail": "Cannot message yourself."}, status=400)
        key = ChatRoom.make_key(request.user.id, target.id)
        room, created = ChatRoom.objects.get_or_create(key=key)
        if created:
            room.participants.add(request.user, target)
        return Response(self.get_serializer(room).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        room = get_object_or_404(self.get_queryset(), pk=pk)
        if request.method == "POST":
            content = (request.data.get("content") or "").strip()
            if not content:
                return Response({"detail": "Empty message."}, status=400)
            msg = Message.objects.create(room=room, sender=request.user, content=content)
            room.save(update_fields=["updated_at"])
            return Response(
                MessageSerializer(msg, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        # GET → mark incoming as read, return history.
        room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        return Response(
            MessageSerializer(room.messages.all(), many=True, context={"request": request}).data
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = Message.objects.filter(
            room__participants=request.user, is_read=False
        ).exclude(sender=request.user).count()
        return Response({"unread": count})


class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post"]

    def get_queryset(self):
        joined = GroupMembership.objects.filter(group=OuterRef("pk"), user=self.request.user)
        return Group.objects.annotate(
            member_count=Count("memberships", distinct=True),
            joined=Exists(joined),
        ).order_by("name")

    def perform_create(self, serializer):
        group = serializer.save(
            created_by=self.request.user,
            slug=slugify(serializer.validated_data["name"]) or "group",
        )
        GroupMembership.objects.create(
            group=group, user=self.request.user, role=GroupMembership.Role.ADMIN
        )

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        group = get_object_or_404(Group, pk=pk)
        GroupMembership.objects.get_or_create(group=group, user=request.user)
        return Response({"joined": True}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        GroupMembership.objects.filter(group_id=pk, user=request.user).delete()
        return Response({"joined": False})

    @action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        """Group chat — members only (Instagram-style gating)."""
        group = get_object_or_404(Group, pk=pk)
        is_member = GroupMembership.objects.filter(group=group, user=request.user).exists()
        if not is_member:
            return Response(
                {"detail": "Join this group to see the chat.", "code": "not_member"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if request.method == "POST":
            content = (request.data.get("content") or "").strip()
            if not content:
                return Response({"detail": "Empty message."}, status=400)
            msg = GroupMessage.objects.create(group=group, sender=request.user, content=content)
            return Response(
                GroupMessageSerializer(msg, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        qs = group.messages.select_related("sender", "sender__profile")
        return Response(
            GroupMessageSerializer(qs, many=True, context={"request": request}).data
        )


class ActivityViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ActivityEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        following_ids = list(
            Follow.objects.filter(follower=user).values_list("following_id", flat=True)
        )
        following_ids.append(user.id)
        return ActivityEvent.objects.filter(
            actor_id__in=following_ids
        ).select_related("actor", "actor__profile")
