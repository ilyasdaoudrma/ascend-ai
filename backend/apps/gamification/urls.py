from rest_framework.routers import DefaultRouter

from .views import AchievementViewSet, GamificationProfileView

app_name = "gamification"

router = DefaultRouter()
router.register("achievements", AchievementViewSet, basename="achievement")
router.register("profile", GamificationProfileView, basename="gamification-profile")

urlpatterns = router.urls
