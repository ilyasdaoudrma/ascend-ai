from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.text import slugify
from rest_framework.test import APIClient

from apps.gamification.models import Achievement, UserAchievement
from .models import Exercise, Workout, WorkoutExercise, WorkoutSession, SetLog, DailyCheckin
from .services import compute_daily_score, compute_streak

User = get_user_model()


def make_workout():
    ex = Exercise.objects.create(name="Squat", slug="squat", muscle_group="legs")
    w = Workout.objects.create(name="Leg Day", slug="leg-day", category="legs")
    WorkoutExercise.objects.create(workout=w, exercise=ex, order=0, sets=3, reps="8")
    return w


class StreakAndScoreTests(TestCase):
    def test_streak_counts_consecutive_days(self):
        today = date.today()
        dates = [today, today - timedelta(days=1), today - timedelta(days=2)]
        self.assertEqual(compute_streak(dates), 3)

    def test_streak_breaks_on_gap(self):
        today = date.today()
        dates = [today, today - timedelta(days=2)]
        self.assertEqual(compute_streak(dates), 1)

    def test_daily_score_rewards_hitting_targets(self):
        class P:
            protein_target_g = 150
            recommended_calories = 2000
            water_target_ml = 3000
            sleep_target_hours = 8

        class C:
            protein_g = 150
            calories = 2000
            water_ml = 3000
            sleep_hours = 8
            workout_completed = True

        self.assertEqual(compute_daily_score(C(), P()), 100)


class WorkoutFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="w@x.com", password="pw")
        self.client.force_authenticate(self.user)
        self.workout = make_workout()
        Achievement.objects.create(
            code="first_workout", name="First", description="d",
            trigger="first_workout", threshold=1, xp_reward=50,
        )

    def test_start_creates_session_and_set_logs(self):
        resp = self.client.post("/api/v1/fitness/sessions/start/", {"workout": self.workout.id}, format="json")
        self.assertEqual(resp.status_code, 201)
        session_id = resp.data["id"]
        # 3 sets pre-created.
        self.assertEqual(SetLog.objects.filter(session_id=session_id).count(), 3)
        self.assertEqual(len(resp.data["set_logs"]), 3)
        self.assertEqual(resp.data["set_logs"][0]["exercise_name"], "Squat")

    def test_complete_awards_xp_and_achievement(self):
        start = self.client.post("/api/v1/fitness/sessions/start/", {"workout": self.workout.id}, format="json")
        sid = start.data["id"]
        # Log a set.
        log_id = start.data["set_logs"][0]["id"]
        self.client.patch(f"/api/v1/fitness/setlogs/{log_id}/", {"reps": 8, "weight_kg": 100, "completed": True}, format="json")
        # Complete.
        resp = self.client.post(f"/api/v1/fitness/sessions/{sid}/complete/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "completed")
        self.assertEqual(resp.data["total_volume_kg"], 800)
        self.assertEqual(resp.data["rewards"]["xp_awarded"], 50)
        self.assertTrue(
            UserAchievement.objects.filter(user=self.user, achievement__code="first_workout").exists()
        )

    def test_setlogs_scoped_to_owner(self):
        other = User.objects.create_user(email="o@x.com", password="pw")
        start = self.client.post("/api/v1/fitness/sessions/start/", {"workout": self.workout.id}, format="json")
        log_id = start.data["set_logs"][0]["id"]
        self.client.force_authenticate(other)
        resp = self.client.patch(f"/api/v1/fitness/setlogs/{log_id}/", {"completed": True}, format="json")
        self.assertEqual(resp.status_code, 404)
