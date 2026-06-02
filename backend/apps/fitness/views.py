from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.gamification.services import award_for_workout, evaluate_achievements
from .models import (
    Exercise, Workout, WorkoutSession, SetLog, Goal, DailyCheckin, Meal,
)
from .serializers import (
    ExerciseSerializer, WorkoutSerializer, WorkoutSessionSerializer, SetLogSerializer,
    GoalSerializer, DailyCheckinSerializer, MealSerializer,
)
from .services import compute_daily_score, compute_streak


class ExerciseViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Read-only public exercise library."""
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["muscle_group", "level"]
    search_fields = ["name", "equipment"]
    ordering_fields = ["name"]


class WorkoutViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Read-only workout template library."""
    queryset = Workout.objects.prefetch_related("items__exercise").all()
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["category", "level"]
    search_fields = ["name", "description"]


class OwnedModelViewSet(viewsets.ModelViewSet):
    """Base viewset that scopes objects to request.user."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutSessionViewSet(OwnedModelViewSet):
    queryset = WorkoutSession.objects.prefetch_related("set_logs__exercise", "workout").all()
    serializer_class = WorkoutSessionSerializer
    filterset_fields = ["status"]

    @action(detail=False, methods=["post"])
    def start(self, request):
        """Start a session from a workout template and pre-create its set logs."""
        workout = get_object_or_404(Workout, pk=request.data.get("workout"))
        session = WorkoutSession.objects.create(user=request.user, workout=workout)
        logs = [
            SetLog(session=session, exercise=item.exercise, set_number=n)
            for item in workout.items.select_related("exercise").all()
            for n in range(1, item.sets + 1)
        ]
        SetLog.objects.bulk_create(logs)
        session = self.get_queryset().get(pk=session.pk)
        return Response(self.get_serializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()
        if session.status == WorkoutSession.Status.COMPLETED:
            return Response(self.get_serializer(session).data)
        session.status = WorkoutSession.Status.COMPLETED
        session.completed_at = timezone.now()
        elapsed = (session.completed_at - session.started_at).total_seconds() / 60
        session.duration_minutes = max(int(elapsed), 1)
        session.total_volume_kg = sum(
            s.reps * s.weight_kg for s in session.set_logs.filter(completed=True)
        )
        session.save()
        rewards = award_for_workout(request.user)
        data = self.get_serializer(session).data
        data["rewards"] = rewards
        return Response(data)


class SetLogViewSet(mixins.UpdateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Update individual set logs (reps / weight / completed) within a session."""
    serializer_class = SetLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SetLog.objects.filter(session__user=self.request.user).select_related("exercise")


class GoalViewSet(OwnedModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer

    def perform_update(self, serializer):
        goal = serializer.save()
        if goal.current_value >= goal.target_value and not goal.is_completed:
            goal.is_completed = True
            goal.save(update_fields=["is_completed"])


class DailyCheckinViewSet(OwnedModelViewSet):
    queryset = DailyCheckin.objects.all()
    serializer_class = DailyCheckinSerializer
    filterset_fields = ["date", "workout_completed", "mood"]

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        checkin = serializer.save(user=self.request.user)
        checkin.daily_score = compute_daily_score(checkin, profile)
        checkin.save(update_fields=["daily_score"])
        # Streak / check-in-count / weight achievements may now unlock.
        evaluate_achievements(self.request.user)

    @action(detail=False, methods=["get"])
    def streak(self, request):
        dates = list(self.get_queryset().values_list("date", flat=True))
        return Response({"streak": compute_streak(dates)})

    @action(detail=False, methods=["get"])
    def today(self, request):
        today = timezone.now().date()
        checkin = self.get_queryset().filter(date=today).first()
        if not checkin:
            return Response({"detail": "No check-in for today."},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(checkin).data)


class MealViewSet(OwnedModelViewSet):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    filterset_fields = ["date", "meal_type"]

    @extend_schema(responses=MealSerializer(many=True))
    @action(detail=False, methods=["get"])
    def today(self, request):
        today = timezone.now().date()
        meals = self.get_queryset().filter(date=today)
        return Response(self.get_serializer(meals, many=True).data)
