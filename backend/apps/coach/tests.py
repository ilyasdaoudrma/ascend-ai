from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class CoachChatTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="c@x.com", password="pw", full_name="Coachee")
        self.client.force_authenticate(self.user)

    def test_recommendations_available_to_all(self):
        resp = self.client.get("/api/v1/coach/recommendations/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("recommendations", resp.data)

    def test_chat_requires_premium(self):
        resp = self.client.post("/api/v1/coach/chat/", {"message": "hi"}, format="json")
        self.assertEqual(resp.status_code, 402)
        self.assertEqual(resp.data["code"], "premium_required")

    @patch("apps.coach.chat._llm_config", return_value=None)
    def test_subscribe_unlocks_chat(self, _mock):
        self.client.post("/api/v1/coach/subscribe/")
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.is_premium)

        # Force the deterministic fallback so the test never calls a real LLM.
        resp = self.client.post("/api/v1/coach/chat/", {"message": "what should I eat today?"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("reply", resp.data)
        self.assertEqual(resp.data["provider"], "fallback")

    def test_staff_can_use_chat_without_premium(self):
        admin = User.objects.create_superuser(email="a@x.com", password="pw")
        client = APIClient()
        client.force_authenticate(admin)
        with patch("apps.coach.chat._llm_config", return_value=None):
            resp = client.post("/api/v1/coach/chat/", {"message": "hi"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("reply", resp.data)
