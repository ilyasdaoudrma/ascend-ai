from rest_framework import viewsets, mixins, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Achievement, UserAchievement, GamificationProfile
from .serializers import (
    AchievementSerializer, UserAchievementSerializer, GamificationProfileSerializer,
)


class AchievementViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=["get"])
    def me(self, request):
        unlocked = UserAchievement.objects.filter(
            user=request.user
        ).select_related("achievement")
        return Response(UserAchievementSerializer(unlocked, many=True).data)


class GamificationProfileView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        profile, _ = GamificationProfile.objects.get_or_create(user=request.user)
        return Response(GamificationProfileSerializer(profile).data)
