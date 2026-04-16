from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds profile fields needed for TeamFinder.
    """

    # Override email to make it unique and required
    email = models.EmailField(unique=True)

    # Profile fields
    bio = models.TextField(blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Skills stored as comma-separated tags e.g. "Python,React,Figma"
    # We keep it simple for now; can migrate to a Tag model later
    skills = models.JSONField(default=list, blank=True)
    # e.g. ["Python", "React Native", "Figma"]

    # Location (optional)
    location = models.CharField(max_length=100, blank=True, default='')

    # GitHub / portfolio link
    portfolio_url = models.URLField(blank=True, default='')

    # Use email as the login field instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.get_full_name()} ({self.email})'

    @property
    def full_name(self):
        return self.get_full_name() or self.username

    @property
    def initials(self):
        """Returns initials for avatar fallback e.g. 'SK' for Sarah Kim."""
        parts = self.get_full_name().split()
        if len(parts) >= 2:
            return f'{parts[0][0]}{parts[-1][0]}'.upper()
        return self.username[:2].upper()
