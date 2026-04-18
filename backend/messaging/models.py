# backend/messaging/models.py
from django.db import models
from django.conf import settings


class DirectMessage(models.Model):
    """
    A private message between two users.
    We store both directions so queries are simple:
      inbox  = DirectMessage.objects.filter(recipient=me)
      outbox = DirectMessage.objects.filter(sender=me)
    """
    sender    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_dms',
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_dms',
    )
    content    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'direct_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'DM {self.sender} → {self.recipient}: {self.content[:40]}'


class GroupChat(models.Model):
    """
    A group chat. Can be standalone or tied to a Team.
    """
    name        = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')

    # Optional link to an existing Team
    team = models.OneToOneField(
        'teams.Team',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='group_chat',
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_chats',
    )

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='GroupChatMembership',
        related_name='group_chats',
        blank=True,
    )

    avatar     = models.ImageField(upload_to='chat_avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)   # bumped when a message is sent

    class Meta:
        db_table = 'group_chats'
        ordering = ['-updated_at']

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.count()


class GroupChatMembership(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]
    chat      = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name='memberships')
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_memberships')
    role      = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    # Track last-read so we can compute unread counts per member
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'group_chat_memberships'
        unique_together = ('chat', 'user')
        ordering = ['joined_at']

    def __str__(self):
        return f'{self.user} in {self.chat}'


class GroupMessage(models.Model):
    """A message inside a GroupChat."""
    chat    = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name='messages')
    author  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_messages',
    )
    content    = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'group_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'[{self.chat.name}] {self.author}: {self.content[:40]}'
