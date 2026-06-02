from rest_framework.routers import DefaultRouter

from .views import (
    ExerciseViewSet, WorkoutViewSet, WorkoutSessionViewSet, SetLogViewSet,
    GoalViewSet, DailyCheckinViewSet, MealViewSet,
)

app_name = "fitness"

router = DefaultRouter()
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("workouts", WorkoutViewSet, basename="workout")
router.register("sessions", WorkoutSessionViewSet, basename="session")
router.register("setlogs", SetLogViewSet, basename="setlog")
router.register("goals", GoalViewSet, basename="goal")
router.register("checkins", DailyCheckinViewSet, basename="checkin")
router.register("meals", MealViewSet, basename="meal")

urlpatterns = router.urls
