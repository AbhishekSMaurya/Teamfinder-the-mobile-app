# backend/messaging/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from .models import DirectMessage, GroupChat, GroupChatMembership, GroupMessage
from .serializers import (
    DirectMessageSerializer,
    SendDirectMessageSerializer,
    GroupChatSerializer,
    GroupMessageSerializer,
    DMConversationSerializer,
    UserMiniSerializer,
)

User = get_user_model()


# ══════════════════════════════════════════════════════════════════════════════
# DIRECT MESSAGES
# ══════════════════════════════════════════════════════════════════════════════

class DMConversationListView(APIView):
    """
    GET /api/messages/conversations/
    Returns a list of all DM conversation threads for the current user,
    sorted by most recent message. Each thread shows: other user, last
    message preview, timestamp, unread count.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user

        # Get all users I've exchanged messages with
        sent_to     = DirectMessage.objects.filter(sender=me).values_list('recipient_id', flat=True)
        received_from = DirectMessage.objects.filter(recipient=me).values_list('sender_id', flat=True)
        peer_ids    = set(sent_to) | set(received_from)

        conversations = []
        for peer_id in peer_ids:
            try:
                peer = User.objects.get(id=peer_id)
            except User.DoesNotExist:
                continue

            # Last message in this thread (either direction)
            last_msg = (
                DirectMessage.objects
                .filter(
                    models.Q(sender=me, recipient=peer) |
                    models.Q(sender=peer, recipient=me)
                )
                .order_by('-created_at')
                .first()
            )
            if not last_msg:
                continue

            unread = DirectMessage.objects.filter(
                sender=peer, recipient=me, is_read=False
            ).count()

            conversations.append({
                'other_user':     peer,
                'last_message':   last_msg.content,
                'last_message_at': last_msg.created_at,
                'unread_count':   unread,
                'is_mine':        last_msg.sender_id == me.id,
            })

        # Sort by most recent
        conversations.sort(key=lambda c: c['last_message_at'], reverse=True)
        serializer = DMConversationSerializer(conversations, many=True)
        return Response(serializer.data)


class DMThreadView(APIView):
    """
    GET  /api/messages/dm/<user_id>/   — fetch messages with a specific user
    POST /api/messages/dm/<user_id>/   — send a message to a specific user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        me = request.user
        try:
            peer = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        # Mark all incoming messages from peer as read
        DirectMessage.objects.filter(
            sender=peer, recipient=me, is_read=False
        ).update(is_read=True)

        messages = (
            DirectMessage.objects
            .filter(
                models.Q(sender=me, recipient=peer) |
                models.Q(sender=peer, recipient=me)
            )
            .order_by('created_at')
            .select_related('sender', 'recipient')
        )
        serializer = DirectMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, user_id):
        me = request.user
        try:
            peer = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        if peer.id == me.id:
            return Response({'detail': 'Cannot message yourself.'}, status=400)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'detail': 'Message content is required.'}, status=400)

        msg = DirectMessage.objects.create(
            sender=me, recipient=peer, content=content
        )
        return Response(DirectMessageSerializer(msg).data, status=201)


class UserSearchView(APIView):
    """
    GET /api/messages/users/search/?q=<query>
    Search users to start a new DM conversation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response([])
        users = User.objects.filter(
            models.Q(username__icontains=q) |
            models.Q(first_name__icontains=q) |
            models.Q(last_name__icontains=q)
        ).exclude(id=request.user.id)[:10]
        return Response(UserMiniSerializer(users, many=True).data)


# ══════════════════════════════════════════════════════════════════════════════
# GROUP CHATS
# ══════════════════════════════════════════════════════════════════════════════

class GroupChatListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/messages/groups/          — list all public groups (discover)
    POST /api/messages/groups/          — create a new group
    """
    serializer_class   = GroupChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '')
        qs = GroupChat.objects.all()
        if q:
            qs = qs.filter(name__icontains=q)
        return qs

    def get_serializer_context(self):
        return {'request': self.request}


class MyGroupChatsView(APIView):
    """
    GET /api/messages/groups/my/
    Returns only the groups the current user is a member of.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        chats = GroupChat.objects.filter(members=request.user).order_by('-updated_at')
        serializer = GroupChatSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)


class RecommendedGroupsView(APIView):
    """
    GET /api/messages/groups/recommended/
    Returns up to 5 groups the user is NOT yet in.
    Used when the user has < 2 group memberships.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        joined_ids = GroupChat.objects.filter(members=user).values_list('id', flat=True)
        recommended = GroupChat.objects.exclude(id__in=joined_ids).order_by('-updated_at')[:5]
        serializer = GroupChatSerializer(recommended, many=True, context={'request': request})
        return Response(serializer.data)


class GroupChatDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/messages/groups/<id>/   — group details + members preview
    PATCH /api/messages/groups/<id>/   — update name/description (admin only)
    """
    serializer_class   = GroupChatSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset           = GroupChat.objects.all()

    def get_serializer_context(self):
        return {'request': self.request}


class GroupJoinLeaveView(APIView):
    """
    POST /api/messages/groups/<id>/join/   — join a group
    POST /api/messages/groups/<id>/leave/  — leave a group
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        try:
            chat = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=404)

        if action == 'join':
            if chat.members.filter(id=request.user.id).exists():
                return Response({'detail': 'Already a member.'}, status=400)
            GroupChatMembership.objects.create(chat=chat, user=request.user, role='member')
            return Response({'detail': 'Joined successfully.'})

        elif action == 'leave':
            membership = GroupChatMembership.objects.filter(chat=chat, user=request.user).first()
            if not membership:
                return Response({'detail': 'Not a member.'}, status=400)
            if membership.role == 'admin' and chat.memberships.filter(role='admin').count() == 1:
                # Last admin — transfer to oldest member or delete
                next_member = chat.memberships.exclude(user=request.user).order_by('joined_at').first()
                if next_member:
                    next_member.role = 'admin'
                    next_member.save()
            membership.delete()
            return Response({'detail': 'Left group.'})

        return Response({'detail': 'Unknown action.'}, status=400)


class GroupMembersView(APIView):
    """GET /api/messages/groups/<id>/members/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            chat = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=404)
        from .serializers import GroupChatMembershipSerializer
        memberships = chat.memberships.select_related('user').all()
        return Response(GroupChatMembershipSerializer(memberships, many=True).data)


# ══════════════════════════════════════════════════════════════════════════════
# GROUP MESSAGES
# ══════════════════════════════════════════════════════════════════════════════

class GroupMessageListCreateView(APIView):
    """
    GET  /api/messages/groups/<id>/messages/  — fetch messages (paginated from end)
    POST /api/messages/groups/<id>/messages/  — send a message
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_chat_and_membership(self, pk, user):
        try:
            chat = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return None, None, Response({'detail': 'Group not found.'}, status=404)
        try:
            membership = GroupChatMembership.objects.get(chat=chat, user=user)
        except GroupChatMembership.DoesNotExist:
            return chat, None, Response({'detail': 'You are not a member of this group.'}, status=403)
        return chat, membership, None

    def get(self, request, pk):
        chat, membership, err = self._get_chat_and_membership(pk, request.user)
        if err:
            return err

        # Support ?before=<message_id> for pagination (load older messages)
        before_id = request.query_params.get('before')
        qs = chat.messages.filter(is_deleted=False).select_related('author')
        if before_id:
            qs = qs.filter(id__lt=before_id)
        messages = qs.order_by('-created_at')[:50]
        messages = list(reversed(messages))   # Return in chronological order

        # Mark as read
        membership.last_read_at = timezone.now()
        membership.save(update_fields=['last_read_at'])

        # Bump chat updated_at so conversation list re-sorts
        GroupChat.objects.filter(pk=pk).update(updated_at=timezone.now())

        serializer = GroupMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        chat, membership, err = self._get_chat_and_membership(pk, request.user)
        if err:
            return err

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'detail': 'Message content is required.'}, status=400)

        msg = GroupMessage.objects.create(chat=chat, author=request.user, content=content)

        # Bump chat updated_at for sorting in conversation list
        GroupChat.objects.filter(pk=pk).update(updated_at=timezone.now())

        serializer = GroupMessageSerializer(msg)
        return Response(serializer.data, status=201)


class GroupMessagePollView(APIView):
    """
    GET /api/messages/groups/<id>/poll/?after=<message_id>
    Long-polling endpoint — returns only messages newer than `after`.
    Frontend polls every 2 seconds while chat is open.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            chat = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=404)

        if not chat.members.filter(id=request.user.id).exists():
            return Response({'detail': 'Not a member.'}, status=403)

        after_id = request.query_params.get('after', 0)
        messages = (
            chat.messages
            .filter(id__gt=after_id, is_deleted=False)
            .select_related('author')
            .order_by('created_at')
        )
        serializer = GroupMessageSerializer(messages, many=True)
        return Response(serializer.data)


class DMPollView(APIView):
    """
    GET /api/messages/dm/<user_id>/poll/?after=<message_id>
    Returns only DMs newer than `after` in either direction.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        me = request.user
        try:
            peer = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        after_id = request.query_params.get('after', 0)
        messages = (
            DirectMessage.objects
            .filter(
                models.Q(sender=me, recipient=peer) |
                models.Q(sender=peer, recipient=me),
                id__gt=after_id,
            )
            .order_by('created_at')
            .select_related('sender', 'recipient')
        )

        # Mark new incoming messages as read
        messages.filter(sender=peer, recipient=me).update(is_read=True)

        serializer = DirectMessageSerializer(messages, many=True)
        return Response(serializer.data)
