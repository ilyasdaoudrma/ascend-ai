from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Profile
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    OnboardingSerializer,
    AdminUserSerializer,
    BanAwareTokenObtainPairSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    serializer_class = BanAwareTokenObtainPairSerializer


def tokens_for(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # allow avatar/banner upload

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class OnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=OnboardingSerializer, responses=ProfileSerializer)
    def post(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = OnboardingSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(ProfileSerializer(profile).data, status=status.HTTP_200_OK)


class AdminUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                       mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """Staff-only user management: list, search, ban/unban, delete."""
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.select_related("profile").all()
    search_fields = ["email", "username", "full_name"]
    ordering_fields = ["date_joined", "email"]

    def perform_destroy(self, instance):
        if instance == self.request.user:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You cannot delete your own admin account.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def ban(self, request, pk=None):
        target = self.get_object()
        if target.is_superuser:
            return Response({"detail": "Cannot ban a superuser."}, status=400)
        days = int(request.data.get("days", 7))
        target.banned_until = timezone.now() + timedelta(days=days)
        target.ban_reason = request.data.get("reason", "")
        target.save(update_fields=["banned_until", "ban_reason"])
        return Response(AdminUserSerializer(target).data)

    @action(detail=True, methods=["post"])
    def unban(self, request, pk=None):
        target = self.get_object()
        target.banned_until = None
        target.ban_reason = ""
        target.save(update_fields=["banned_until", "ban_reason"])
        return Response(AdminUserSerializer(target).data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        from apps.social.models import Post
        from apps.fitness.models import WorkoutSession
        return Response({
            "total_users": User.objects.count(),
            "active_today": User.objects.filter(
                last_login__date=timezone.now().date()
            ).count(),
            "banned": User.objects.filter(banned_until__gt=timezone.now()).count(),
            "staff": User.objects.filter(is_staff=True).count(),
            "total_posts": Post.objects.count(),
            "total_workouts": WorkoutSession.objects.filter(status="completed").count(),
        })
