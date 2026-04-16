from rest_framework import serializers
from .models import Announcement
from users.serializers import UserMiniSerializer


class AnnouncementSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'description', 'tags',
            'attachment_url', 'author', 'team', 'team_name',
            'is_archived', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
