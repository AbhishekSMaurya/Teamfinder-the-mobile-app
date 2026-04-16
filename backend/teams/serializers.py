from rest_framework import serializers
from .models import Team, TeamMembership, TeamJoinRequest
from users.serializers import UserMiniSerializer


class TeamMembershipSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = TeamMembership
        fields = ['id', 'user', 'role', 'joined_at']


class TeamSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    members_preview = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'tags', 'status',
            'created_by', 'avatar', 'member_count',
            'members_preview', 'is_member', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_members_preview(self, obj):
        """Returns first 3 members for avatar stack in UI."""
        memberships = obj.memberships.select_related('user')[:3]
        return UserMiniSerializer([m.user for m in memberships], many=True).data

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def create(self, validated_data):
        user = self.context['request'].user
        team = Team.objects.create(created_by=user, **validated_data)
        # Creator automatically becomes owner
        TeamMembership.objects.create(team=team, user=user, role='owner')
        return team


class TeamJoinRequestSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = TeamJoinRequest
        fields = ['id', 'team', 'team_name', 'user', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at']
