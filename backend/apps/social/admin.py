from django.contrib import admin

from .models import (
    Follow, Friendship, Post, PostLike, Comment, Notification,
    Challenge, ChallengeParticipant, ChatRoom, Message, Group,
    GroupMembership, GroupMessage, ActivityEvent,
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("author", "post_type", "created_at")
    list_filter = ("post_type",)
    search_fields = ("author__email", "content")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "kind", "is_read", "created_at")
    list_filter = ("kind", "is_read")


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("title", "target_value", "unit")
    prepopulated_fields = {"slug": ("title",)}


admin.site.register(Follow)
admin.site.register(Friendship)
admin.site.register(PostLike)
admin.site.register(Comment)
admin.site.register(ChallengeParticipant)
admin.site.register(ChatRoom)
admin.site.register(Message)
admin.site.register(Group)
admin.site.register(GroupMembership)
admin.site.register(GroupMessage)
admin.site.register(ActivityEvent)
