from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


def health(_request):
    """Root health check (used by hosting platforms) — returns 200."""
    return JsonResponse({"status": "ok", "service": "Ascend AI API", "docs": "/api/docs/"})


api_v1 = [
    path("auth/", include("apps.accounts.urls")),
    path("fitness/", include("apps.fitness.urls")),
    path("gamification/", include("apps.gamification.urls")),
    path("coach/", include("apps.coach.urls")),
    path("social/", include("apps.social.urls")),
]

urlpatterns = [
    path("", health),
    path("django-admin/", admin.site.urls),
    path("api/v1/", include((api_v1, "api"), namespace="v1")),
    # API schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
