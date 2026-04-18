# backend/core/feed_views.py
# GET /api/feed/   — returns a unified activity feed aggregated from all models
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from itertools import chain

from users.serializers import UserMiniSerializer

User = get_user_model()


def _user_mini(user):
    if user is None:
        return None
    return {
        'id': user.id,
        'username': user.username,
        'full_name': user.get_full_name() or user.username,
        'initials': (
            (user.get_full_name() or user.username)[:2].upper()
        ),
    }


class FeedView(APIView):
    """
    GET /api/feed/?page=1
    Returns a unified, chronological activity feed built from:
      - New posts (discussions, articles, questions)
      - New projects created
      - New teams created
      - New announcements
      - New group chats created
      - Post likes (on posts the user authored or follows)
    Each item has a consistent shape:
      { id, type, actor, action_text, target, target_detail, created_at, meta }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page     = int(request.query_params.get('page', 1))
        per_page = 20
        offset   = (page - 1) * per_page

        events = []

        # ── Posts ──────────────────────────────────────────────────────────
        try:
            from posts.models import Post, Like
            posts = (
                Post.objects
                .filter(is_deleted=False, is_draft=False)
                .select_related('author', 'team')
                .order_by('-created_at')[:60]
            )
            for p in posts:
                type_label = {
                    'discussion': 'posted a discussion',
                    'article':    'shared an article',
                    'question':   'asked a question',
                    'update':     'posted an update',
                }.get(p.post_type, 'made a post')

                events.append({
                    'id':            f'post_{p.id}',
                    'type':          'post',
                    'post_type':     p.post_type,
                    'actor':         _user_mini(p.author),
                    'action_text':   type_label,
                    'target':        p.content[:120] + ('…' if len(p.content) > 120 else ''),
                    'target_detail': p.team.name if p.team else None,
                    'tags':          p.tags or [],
                    'meta': {
                        'like_count':    p.like_count,
                        'comment_count': p.comment_count,
                        'post_id':       p.id,
                    },
                    'created_at': p.created_at.isoformat(),
                })

            # Recent likes on all posts
            likes = (
                Like.objects
                .select_related('user', 'post__author')
                .order_by('-created_at')[:40]
            )
            for lk in likes:
                if lk.user_id == lk.post.author_id:
                    continue   # skip self-likes
                events.append({
                    'id':            f'like_{lk.id}',
                    'type':          'like',
                    'post_type':     None,
                    'actor':         _user_mini(lk.user),
                    'action_text':   'liked a post by',
                    'target':        lk.post.author.get_full_name() or lk.post.author.username,
                    'target_detail': lk.post.content[:80],
                    'tags':          [],
                    'meta':          {'post_id': lk.post_id},
                    'created_at':    lk.created_at.isoformat(),
                })
        except Exception:
            pass

        # ── Projects ───────────────────────────────────────────────────────
        try:
            from posts.models import Project
            projects = (
                Project.objects
                .select_related('created_by', 'team')
                .order_by('-created_at')[:30]
            )
            for pr in projects:
                events.append({
                    'id':            f'project_{pr.id}',
                    'type':          'project',
                    'post_type':     None,
                    'actor':         _user_mini(pr.created_by),
                    'action_text':   'created a project',
                    'target':        pr.name,
                    'target_detail': pr.team.name if pr.team else None,
                    'tags':          pr.tags or [],
                    'meta': {
                        'status':   pr.status,
                        'progress': pr.progress,
                    },
                    'created_at': pr.created_at.isoformat(),
                })
        except Exception:
            pass

        # ── Teams ──────────────────────────────────────────────────────────
        try:
            from teams.models import Team, TeamMembership
            teams = (
                Team.objects
                .select_related('created_by')
                .order_by('-created_at')[:30]
            )
            for t in teams:
                events.append({
                    'id':            f'team_{t.id}',
                    'type':          'team',
                    'post_type':     None,
                    'actor':         _user_mini(t.created_by),
                    'action_text':   'created a team',
                    'target':        t.name,
                    'target_detail': f'{t.member_count} members',
                    'tags':          t.tags or [],
                    'meta':          {'team_id': t.id, 'status': t.status},
                    'created_at':    t.created_at.isoformat(),
                })

            # Team joins
            joins = (
                TeamMembership.objects
                .select_related('user', 'team')
                .order_by('-joined_at')[:30]
            )
            for j in joins:
                events.append({
                    'id':            f'join_{j.id}',
                    'type':          'team_join',
                    'post_type':     None,
                    'actor':         _user_mini(j.user),
                    'action_text':   'joined a team',
                    'target':        j.team.name,
                    'target_detail': None,
                    'tags':          [],
                    'meta':          {'team_id': j.team_id, 'role': j.role},
                    'created_at':    j.joined_at.isoformat(),
                })
        except Exception:
            pass

        # ── Announcements ──────────────────────────────────────────────────
        try:
            from announcements.models import Announcement
            anns = (
                Announcement.objects
                .filter(is_archived=False)
                .select_related('author', 'team')
                .order_by('-created_at')[:30]
            )
            for a in anns:
                events.append({
                    'id':            f'ann_{a.id}',
                    'type':          'announcement',
                    'post_type':     None,
                    'actor':         _user_mini(a.author),
                    'action_text':   'posted an announcement',
                    'target':        a.title,
                    'target_detail': a.description[:100] if a.description else None,
                    'tags':          a.tags or [],
                    'meta':          {'has_attachment': bool(a.attachment_url)},
                    'created_at':    a.created_at.isoformat(),
                })
        except Exception:
            pass

        # ── Group chats created ────────────────────────────────────────────
        try:
            from messaging.models import GroupChat
            groups = (
                GroupChat.objects
                .select_related('created_by')
                .order_by('-created_at')[:20]
            )
            for g in groups:
                events.append({
                    'id':            f'group_{g.id}',
                    'type':          'group',
                    'post_type':     None,
                    'actor':         _user_mini(g.created_by),
                    'action_text':   'created a group',
                    'target':        g.name,
                    'target_detail': g.description[:80] if g.description else None,
                    'tags':          [],
                    'meta':          {'group_id': g.id, 'member_count': g.member_count},
                    'created_at':    g.created_at.isoformat(),
                })
        except Exception:
            pass

        # ── Sort all events by created_at desc, paginate ───────────────────
        events.sort(key=lambda e: e['created_at'], reverse=True)
        paginated = events[offset: offset + per_page]

        return Response({
            'results':  paginated,
            'count':    len(events),
            'page':     page,
            'has_next': (offset + per_page) < len(events),
        })
