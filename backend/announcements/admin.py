from django.contrib import admin
from .models import Announcement

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'team', 'is_archived', 'created_at']
    search_fields = ['title', 'description']
    list_filter = ['is_archived']
