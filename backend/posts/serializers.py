from rest_framework import serializers
from .models import Post, Comment, Like, Project
from users.serializers import UserMiniSerializer


class CommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'parent',
            'content', 'replies', 'is_deleted', 'created_at',
        ]
        read_only_fields = ['id', 'author', 'created_at']

    def get_replies(self, obj):
        if obj.parent is None:
            # Only fetch replies for top-level comments
            replies = obj.replies.filter(is_deleted=False)
            return CommentSerializer(replies, many=True, context=self.context).data
        return []

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'team', 'team_name', 'content',
            'post_type', 'tags', 'link_url', 'link_preview_image',
            'is_draft', 'like_count', 'comment_count', 'is_liked',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    team_member_count = serializers.IntegerField(source='team.member_count', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'team', 'team_name',
            'team_member_count', 'created_by', 'progress',
            'status', 'tags', 'repo_url', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
