from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, MeView, ProfileView, OnboardingView, AdminUserViewSet,
)

app_name = "accounts"

router = DefaultRouter()
router.register("admin/users", AdminUserViewSet, basename="admin-user")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("onboarding/", OnboardingView.as_view(), name="onboarding"),
]
urlpatterns += router.urls
