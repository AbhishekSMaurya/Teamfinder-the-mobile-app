from django.db import models
from django.conf import settings


class Announcement(models.Model):
    """
    Announcements posted by users — e.g. looking for teammates,
    study groups, hackathon calls, etc.
    """

    title = models.CharField(max_length=255)
    description = models.TextField()

    # Author of the announcement
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='announcements'
    )

    # Optional team association — if this announcement belongs to a team
    team = models.ForeignKey(
        'teams.Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements'
    )

    # Tags e.g. ["#React", "#MLH", "#WebDev"]
    tags = models.JSONField(default=list, blank=True)

    # Optional attachment URL (link to doc, repo, etc.)
    attachment_url = models.URLField(blank=True, default='')

    # Soft delete — archived announcements are hidden but not deleted from DB
    is_archived = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} by {self.author}'
