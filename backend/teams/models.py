from django.db import models
from django.conf import settings


class Team(models.Model):
    """
    A team that users can create or join.
    Every new user is auto-assigned 2 recommended teams on signup.
    """

    TEAM_STATUS_CHOICES = [
        ('open', 'Open'),           # Anyone can request to join
        ('closed', 'Closed'),       # Invite only
        ('archived', 'Archived'),   # No longer active
    ]

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')

    # Tags used for recommendation matching e.g. ["Python", "ML", "Data"]
    tags = models.JSONField(default=list, blank=True)

    status = models.CharField(
        max_length=20,
        choices=TEAM_STATUS_CHOICES,
        default='open'
    )

    # The user who created the team
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_teams'
    )

    # All members including the creator
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='TeamMembership',
        related_name='teams',
        blank=True
    )

    # Optional avatar/banner image
    avatar = models.ImageField(upload_to='team_avatars/', blank=True, null=True)

    # Whether this team is a system-generated recommendation seed
    is_recommendation_seed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teams'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.count()


class TeamMembership(models.Model):
    """
    Through model for Team <-> User relationship.
    Tracks role and join date for each member.
    """

    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'team_memberships'
        unique_together = ('team', 'user')   # One membership per user per team
        ordering = ['joined_at']

    def __str__(self):
        return f'{self.user} in {self.team} as {self.role}'


class TeamJoinRequest(models.Model):
    """
    A request from a user to join a closed team.
    Owner/admin can approve or reject.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='join_requests'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='join_requests'
    )
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_requests'
    )

    class Meta:
        db_table = 'team_join_requests'
        unique_together = ('team', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} -> {self.team} ({self.status})'
