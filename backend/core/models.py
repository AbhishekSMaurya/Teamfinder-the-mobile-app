from django.db import models
from django.conf import settings


class Tag(models.Model):
    """
    Global tag registry.
    Used for skill recommendations and Explore screen trending topics.
    """
    name = models.CharField(max_length=50, unique=True)
    usage_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'tags'
        ordering = ['-usage_count']

    def __str__(self):
        return self.name


class Notification(models.Model):
    """
    In-app notifications for a user.
    e.g. "Sarah Kim commented on your post"
    """

    NOTIFICATION_TYPE_CHOICES = [
        ('comment', 'Comment on your post'),
        ('like', 'Like on your post'),
        ('join_request', 'Team join request'),
        ('join_approved', 'Join request approved'),
        ('announcement', 'New announcement in your team'),
        ('project_update', 'Project updated'),
        ('mention', 'You were mentioned'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )

    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPE_CHOICES)
    message = models.CharField(max_length=255)

    # Generic FK to link back to the relevant object
    # e.g. link to the post, announcement, or project
    target_url = models.CharField(max_length=255, blank=True, default='')

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'Notification for {self.recipient}: {self.message}'
