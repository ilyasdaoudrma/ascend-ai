from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    PostViewSet, SocialUserViewSet, LeaderboardView,
    NotificationViewSet, ChallengeViewSet, FriendshipViewSet,
    ChatRoomViewSet, GroupViewSet, ActivityViewSet,
)

app_name = "social"

router = DefaultRouter()
router.register("posts", PostViewSet, basename="post")
router.register("users", SocialUserViewSet, basename="social-user")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("challenges", ChallengeViewSet, basename="challenge")
router.register("friends", FriendshipViewSet, basename="friend")
router.register("chat", ChatRoomViewSet, basename="chat")
router.register("groups", GroupViewSet, basename="group")
router.register("activity", ActivityViewSet, basename="activity")

urlpatterns = [
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
urlpatterns += router.urls
