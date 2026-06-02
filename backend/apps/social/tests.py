from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Post, Follow, Notification

User = get_user_model()


class SocialFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.alice = User.objects.create_user(email="alice@x.com", password="pw", full_name="Alice")
        self.bob = User.objects.create_user(email="bob@x.com", password="pw", full_name="Bob")
        self.client.force_authenticate(self.alice)

    def test_username_auto_generated(self):
        self.assertTrue(self.alice.username)
        self.assertNotEqual(self.alice.username, self.bob.username)

    def test_create_and_like_post_notifies_author(self):
        # Bob posts.
        post = Post.objects.create(author=self.bob, content="hello world")
        # Alice likes it.
        resp = self.client.post(f"/api/v1/social/posts/{post.id}/like/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["liked"])
        self.assertEqual(resp.data["like_count"], 1)
        # Bob got a like notification.
        self.assertTrue(
            Notification.objects.filter(recipient=self.bob, kind="like").exists()
        )
        # Unlike toggles off.
        resp = self.client.post(f"/api/v1/social/posts/{post.id}/like/")
        self.assertFalse(resp.data["liked"])

    def test_follow_creates_notification_and_feed(self):
        resp = self.client.post(f"/api/v1/social/users/{self.bob.username}/follow/")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Follow.objects.filter(follower=self.alice, following=self.bob).exists())
        self.assertTrue(Notification.objects.filter(recipient=self.bob, kind="follow").exists())

        # Bob posts → appears in Alice's "following" feed.
        Post.objects.create(author=self.bob, content="leg day done")
        resp = self.client.get("/api/v1/social/posts/?scope=following")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["author"]["full_name"], "Bob")

    def test_comment_flow(self):
        post = Post.objects.create(author=self.bob, content="hi")
        resp = self.client.post(f"/api/v1/social/posts/{post.id}/comments/", {"content": "nice!"}, format="json")
        self.assertEqual(resp.status_code, 201)
        resp = self.client.get(f"/api/v1/social/posts/{post.id}/comments/")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["content"], "nice!")

    def test_public_profile_and_leaderboard(self):
        resp = self.client.get(f"/api/v1/social/users/{self.bob.username}/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("stats", resp.data)
        self.assertIn("followers", resp.data["stats"])

        resp = self.client.get("/api/v1/social/leaderboard/?category=xp")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("entries", resp.data)

    def test_direct_messaging_flow(self):
        # Alice opens a room with Bob and sends a message.
        resp = self.client.post("/api/v1/social/chat/open/", {"username": self.bob.username}, format="json")
        self.assertEqual(resp.status_code, 201)
        room_id = resp.data["id"]
        resp = self.client.post(f"/api/v1/social/chat/{room_id}/messages/", {"content": "hey bob"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.data["is_mine"])

        # Bob sees one unread, then reading clears it.
        bob_client = APIClient()
        bob_client.force_authenticate(self.bob)
        self.assertEqual(bob_client.get("/api/v1/social/chat/unread_count/").data["unread"], 1)
        msgs = bob_client.get(f"/api/v1/social/chat/{room_id}/messages/").data
        self.assertEqual(len(msgs), 1)
        self.assertFalse(msgs[0]["is_mine"])
        self.assertEqual(bob_client.get("/api/v1/social/chat/unread_count/").data["unread"], 0)

    def test_friend_request_accept(self):
        resp = self.client.post("/api/v1/social/friends/request_friend/", {"username": self.bob.username}, format="json")
        self.assertEqual(resp.status_code, 201)
        fid = resp.data["id"]
        bob_client = APIClient()
        bob_client.force_authenticate(self.bob)
        self.assertEqual(len(bob_client.get("/api/v1/social/friends/requests/").data), 1)
        bob_client.post(f"/api/v1/social/friends/{fid}/accept/")
        self.assertEqual(len(bob_client.get("/api/v1/social/friends/").data), 1)

    def test_groups_join_leave(self):
        resp = self.client.post("/api/v1/social/groups/", {"name": "Calisthenics Crew", "description": "x"}, format="json")
        self.assertEqual(resp.status_code, 201)
        gid = resp.data["id"]
        resp = self.client.get("/api/v1/social/groups/")
        self.assertTrue(any(g["joined"] for g in resp.data["results"]))

    def test_group_chat_is_member_gated(self):
        from .models import Group, GroupMessage
        # Bob owns a group with a message; Alice is not a member.
        group = Group.objects.create(name="Runners", slug="runners", created_by=self.bob)
        from .models import GroupMembership
        GroupMembership.objects.create(group=group, user=self.bob)
        GroupMessage.objects.create(group=group, sender=self.bob, content="first!")

        # Alice (non-member) is blocked from the chat.
        resp = self.client.get(f"/api/v1/social/groups/{group.id}/messages/")
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.data["code"], "not_member")

        # After joining she sees the past messages and can post.
        self.client.post(f"/api/v1/social/groups/{group.id}/join/")
        resp = self.client.get(f"/api/v1/social/groups/{group.id}/messages/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        resp = self.client.post(f"/api/v1/social/groups/{group.id}/messages/", {"content": "hi all"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.data["is_mine"])

    def test_activity_feed_includes_own_post(self):
        Post.objects.create(author=self.alice, content="hi")
        resp = self.client.get("/api/v1/social/activity/")
        self.assertGreaterEqual(resp.data["count"], 1)
