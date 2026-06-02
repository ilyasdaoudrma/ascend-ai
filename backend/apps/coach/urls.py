from django.urls import path

from .views import RecommendationsView, CoachChatView, SubscribeView

app_name = "coach"

urlpatterns = [
    path("recommendations/", RecommendationsView.as_view(), name="recommendations"),
    path("chat/", CoachChatView.as_view(), name="chat"),
    path("subscribe/", SubscribeView.as_view(), name="subscribe"),
]
