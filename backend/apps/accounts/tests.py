from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .services import compute_metrics

User = get_user_model()


class MetricEngineTests(TestCase):
    def test_bmi_and_tdee_are_reasonable(self):
        result = compute_metrics(
            weight_kg=80, height_cm=180, age=30, gender="male",
            activity_level="moderate", goal="fat_loss",
        )
        self.assertAlmostEqual(result.bmi, 24.7, delta=0.2)
        self.assertGreater(result.tdee, result.bmr)
        # Fat-loss should recommend below maintenance.
        self.assertLess(result.recommended_calories, result.maintenance_calories)
        # Protein target around 2.2 g/kg for fat loss.
        self.assertAlmostEqual(result.protein_target_g, 176, delta=2)

    def test_calorie_floor_respected(self):
        result = compute_metrics(
            weight_kg=45, height_cm=150, age=60, gender="female",
            activity_level="sedentary", goal="weight_loss",
        )
        self.assertGreaterEqual(result.recommended_calories, 1200)


class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_then_login_and_onboard(self):
        # Register
        resp = self.client.post("/api/v1/auth/register/", {
            "email": "a@b.com", "full_name": "A B",
            "password": "Str0ngPass!", "password_confirm": "Str0ngPass!",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        token = resp.data["tokens"]["access"]

        # Onboard
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resp = self.client.post("/api/v1/auth/onboarding/", {
            "gender": "male", "age": 28, "height_cm": 178, "weight_kg": 80,
            "activity_level": "moderate", "experience": "beginner",
            "goal": "muscle_gain", "weekly_training_days": 4,
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["onboarding_completed"])
        self.assertIsNotNone(resp.data["tdee"])

    def test_profile_created_via_signal(self):
        user = User.objects.create_user(email="c@d.com", password="x")
        self.assertTrue(hasattr(user, "profile"))


class AdminModerationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(email="admin@x.com", password="pw")
        self.victim = User.objects.create_user(email="v@x.com", password="pw")
        self.client.force_authenticate(self.admin)

    def test_non_admin_cannot_list_users(self):
        self.client.force_authenticate(self.victim)
        resp = self.client.get("/api/v1/auth/admin/users/")
        self.assertEqual(resp.status_code, 403)

    def test_admin_can_ban_and_unban(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        # Token minted before the ban.
        token = str(RefreshToken.for_user(self.victim).access_token)

        resp = self.client.post(f"/api/v1/auth/admin/users/{self.victim.id}/ban/",
                                {"days": 3, "reason": "spam"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.victim.refresh_from_db()
        self.assertTrue(self.victim.is_currently_banned)

        # The ban-aware JWT auth rejects the still-valid token.
        banned_client = APIClient()
        banned_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resp = banned_client.get("/api/v1/auth/me/")
        self.assertEqual(resp.status_code, 401)

        # Unban restores access.
        self.client.post(f"/api/v1/auth/admin/users/{self.victim.id}/unban/")
        self.victim.refresh_from_db()
        self.assertFalse(self.victim.is_currently_banned)
        resp = banned_client.get("/api/v1/auth/me/")
        self.assertEqual(resp.status_code, 200)

    def test_admin_cannot_delete_self(self):
        resp = self.client.delete(f"/api/v1/auth/admin/users/{self.admin.id}/")
        self.assertEqual(resp.status_code, 400)

    def test_admin_can_delete_user(self):
        resp = self.client.delete(f"/api/v1/auth/admin/users/{self.victim.id}/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(User.objects.filter(id=self.victim.id).exists())
