from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class BanAwareJWTAuthentication(JWTAuthentication):
    """Rejects valid tokens belonging to currently-banned users."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user.is_currently_banned:
            raise AuthenticationFailed(
                detail="Your account is temporarily banned.",
                code="account_banned",
            )
        return user
