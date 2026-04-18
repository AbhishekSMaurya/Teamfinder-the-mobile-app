# backend/messaging/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DirectMessage, GroupChat, GroupChatMembership, GroupMessage

User = get_user_model()


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    initials  = serializers.CharField(read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'username', 'full_name', 'initials', 'avatar']


# ── Direct Messages ────────────────────────────────────────────────────────

class DirectMessageSerializer(serializers.ModelSerializer):
    sender    = UserMiniSerializer(read_only=True)
    recipient = UserMiniSerializer(read_only=True)

    class Meta:
        model  = DirectMessage
        fields = ['id', 'sender', 'recipient', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'is_read', 'created_at']


class SendDirectMessageSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField()
    content      = serializers.CharField(min_length=1, max_length=4000)


# ── Group Chat ─────────────────────────────────────────────────────────────

class GroupChatMembershipSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model  = GroupChatMembership
        fields = ['id', 'user', 'role', 'joined_at']


class GroupChatSerializer(serializers.ModelSerializer):
    created_by      = UserMiniSerializer(read_only=True)
    member_count    = serializers.IntegerField(read_only=True)
    members_preview = serializers.SerializerMethodField()
    is_member       = serializers.SerializerMethodField()
    unread_count    = serializers.SerializerMethodField()
    last_message    = serializers.SerializerMethodField()

    class Meta:
        model  = GroupChat
        fields = [
            'id', 'name', 'description', 'team',
            'created_by', 'avatar', 'member_count',
            'members_preview', 'is_member', 'unread_count',
            'last_message', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_members_preview(self, obj):
        memberships = obj.memberships.select_related('user')[:4]
        return UserMiniSerializer([m.user for m in memberships], many=True).data

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        try:
            membership = obj.memberships.get(user=request.user)
            if membership.last_read_at:
                return obj.messages.filter(
                    created_at__gt=membership.last_read_at,
                    is_deleted=False,
                ).exclude(author=request.user).count()
            else:
                return obj.messages.filter(is_deleted=False).exclude(author=request.user).count()
        except GroupChatMembership.DoesNotExist:
            return 0

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).last()
        if msg:
            return {
                'content': msg.content,
                'author': msg.author.full_name or msg.author.username,
                'created_at': msg.created_at,
            }
        return None

    def create(self, validated_data):
        user  = self.context['request'].user
        chat  = GroupChat.objects.create(created_by=user, **validated_data)
        GroupChatMembership.objects.create(chat=chat, user=user, role='admin')
        return chat


class GroupMessageSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)

    class Meta:
        model  = GroupMessage
        fields = ['id', 'chat', 'author', 'content', 'is_deleted', 'created_at']
        read_only_fields = ['id', 'chat', 'author', 'is_deleted', 'created_at']


# ── Conversation list item (DM thread summary) ─────────────────────────────

class DMConversationSerializer(serializers.Serializer):
    """
    Represents a DM conversation thread with one other user.
    Not a model serializer — assembled in the view.
    """
    other_user    = UserMiniSerializer()
    last_message  = serializers.CharField()
    last_message_at = serializers.DateTimeField()
    unread_count  = serializers.IntegerField()
    is_mine       = serializers.BooleanField()   # was the last msg sent by me?
