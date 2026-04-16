from django.db import models
from django.conf import settings


class Post(models.Model):
    """
    A post created by a user — can be an article share,
    question, update, or general discussion.
    """

    POST_TYPE_CHOICES = [
        ('article', 'Article'),
        ('question', 'Question'),
        ('update', 'Update'),
        ('discussion', 'Discussion'),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )

    # Optional team this post belongs to
    team = models.ForeignKey(
        'teams.Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts'
    )

    content = models.TextField()
    post_type = models.CharField(
        max_length=20,
        choices=POST_TYPE_CHOICES,
        default='discussion'
    )

    # Tags e.g. ["#React", "#ML", "#WebDev"]
    tags = models.JSONField(default=list, blank=True)

    # Optional external link (article URL, repo, etc.)
    link_url = models.URLField(blank=True, default='')
    link_preview_image = models.URLField(blank=True, default='')

    # Draft posts are only visible to the author
    is_draft = models.BooleanField(default=False)

    # Soft delete
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

    def __str__(self):
        return f'Post by {self.author} at {self.created_at:%Y-%m-%d}'

    @property
    def like_count(self):
        return self.likes.count()

    @property
    def comment_count(self):
        # Only count top-level comments (not replies)
        return self.comments.filter(parent=None, is_deleted=False).count()


class Comment(models.Model):
    """
    A comment on a Post.
    Supports one level of nesting — replies to comments via parent FK.
    """

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )

    # Null parent = top-level comment. Non-null = reply to another comment.
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )

    content = models.TextField()

    # Soft delete so replies don't orphan visually
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']   # Oldest first so thread reads top-to-bottom

    def __str__(self):
        return f'Comment by {self.author} on Post #{self.post_id}'

    @property
    def is_reply(self):
        return self.parent_id is not None


class Like(models.Model):
    """
    A like on a Post by a user.
    Unique constraint ensures one like per user per post.
    """

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='liked_posts'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_likes'
        unique_together = ('post', 'user')   # Can't like the same post twice

    def __str__(self):
        return f'{self.user} liked Post #{self.post_id}'


class Project(models.Model):
    """
    A project that a team is working on.
    Linked from the Projects screen.
    """

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('open', 'Open for members'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')

    team = models.ForeignKey(
        'teams.Team',
        on_delete=models.CASCADE,
        related_name='projects'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_projects'
    )

    # Progress as a percentage 0-100
    progress = models.PositiveSmallIntegerField(default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Tags e.g. ["#IoT", "#Python", "#Hardware"]
    tags = models.JSONField(default=list, blank=True)

    # Optional external repo or doc link
    repo_url = models.URLField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.team})'
