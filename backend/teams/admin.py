from django.contrib import admin
from .models import Team, TeamMembership, TeamJoinRequest

class MembershipInline(admin.TabularInline):
    model = TeamMembership
    extra = 0

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'member_count', 'created_by', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['status']
    inlines = [MembershipInline]

@admin.register(TeamJoinRequest)
class TeamJoinRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'team', 'status', 'created_at']
    list_filter = ['status']
