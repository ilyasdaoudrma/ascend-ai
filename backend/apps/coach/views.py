from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .engine import generate_recommendations
from .chat import chat_reply, active_provider


class RecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses=OpenApiResponse(
            description="List of personalised coach recommendations."
        ),
        summary="Get AI coach recommendations for the current user",
    )
    def get(self, request):
        recs = generate_recommendations(request.user)
        return Response({"recommendations": recs})


def _can_use_chat(user) -> bool:
    """Pro subscribers and staff/admins can use the AI Coach chat."""
    profile = getattr(user, "profile", None)
    return bool(user.is_staff or (profile and profile.is_premium))


class CoachChatView(APIView):
    """Conversational AI coach — gated behind a Pro subscription (admins exempt)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Lets the frontend know whether chat is available / which provider.
        return Response({
            "can_use": _can_use_chat(request.user),
            "is_premium": bool(getattr(request.user, "profile", None) and request.user.profile.is_premium),
            "is_staff": request.user.is_staff,
            "provider": active_provider(),
        })

    def post(self, request):
        if not _can_use_chat(request.user):
            return Response(
                {"detail": "AI Coach chat is a Pro feature.", "code": "premium_required"},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"detail": "Message is empty."}, status=400)
        history = request.data.get("history", [])
        result = chat_reply(request.user, message, history)
        return Response(result)


class SubscribeView(APIView):
    """
    Stub that flips the Pro flag on. In production this is set by your payment
    webhook (e.g. Stripe checkout.session.completed) — never trust the client.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        profile.is_premium = True
        profile.save(update_fields=["is_premium"])
        return Response({"is_premium": True})
