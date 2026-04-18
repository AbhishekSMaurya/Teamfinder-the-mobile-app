# backend/messaging/admin.py
from django.contrib import admin
from .models import DirectMessage, GroupChat, GroupChatMembership, GroupMessage

@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'content', 'is_read', 'created_at']
    list_filter  = ['is_read', 'created_at']

@admin.register(GroupChat)
class GroupChatAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'member_count', 'created_at']

@admin.register(GroupChatMembership)
class GroupChatMembershipAdmin(admin.ModelAdmin):
    list_display = ['chat', 'user', 'role', 'joined_at']

@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ['chat', 'author', 'content', 'created_at']
