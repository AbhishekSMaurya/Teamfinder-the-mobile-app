from django.contrib import admin
from .models import Post, Comment, Like, Project

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['author', 'post_type', 'is_draft', 'is_deleted', 'created_at']
    list_filter = ['post_type', 'is_draft', 'is_deleted']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'parent', 'is_deleted', 'created_at']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'team', 'status', 'progress', 'created_at']
    list_filter = ['status']
