from django.contrib import admin
from .models import Tag, Notification

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'usage_count']
    ordering = ['-usage_count']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
