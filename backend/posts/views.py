from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Post, Comment, Like, Project
from .serializers import PostSerializer, CommentSerializer, ProjectSerializer


class PostViewSet(viewsets.ModelViewSet):
    """
    GET    /api/posts/              — all posts (feed)
    POST   /api/posts/              — create post
    GET    /api/posts/<id>/         — post detail
    PUT    /api/posts/<id>/         — update (author only)
    DELETE /api/posts/<id>/         — soft delete (author only)
    POST   /api/posts/<id>/like/    — toggle like
    GET    /api/posts/<id>/comments/— list comments
    POST   /api/posts/<id>/comments/— add comment
    GET    /api/posts/mine/         — current user's posts
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['content', 'tags']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Post.objects.filter(is_deleted=False).select_related('author', 'team')

        # Filter by draft status
        is_draft = self.request.query_params.get('draft')
        if is_draft == 'true':
            queryset = queryset.filter(author=self.request.user, is_draft=True)
        else:
            queryset = queryset.filter(is_draft=False)

        # Filter by post type
        post_type = self.request.query_params.get('type')
        if post_type:
            queryset = queryset.filter(post_type=post_type)

        return queryset

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the author can delete this post.')
        instance.is_deleted = True
        instance.save()

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        posts = Post.objects.filter(author=request.user, is_deleted=False)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='like')
    def like(self, request, pk=None):
        """POST /api/posts/<id>/like/ — toggles like on/off."""
        post = self.get_object()
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False, 'like_count': post.like_count})
        return Response({'liked': True, 'like_count': post.like_count})

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        """
        GET  /api/posts/<id>/comments/ — list comments for a post
        POST /api/posts/<id>/comments/ — add a comment
        """
        post = self.get_object()

        if request.method == 'GET':
            comments = post.comments.filter(
                parent=None, is_deleted=False
            ).select_related('author').prefetch_related('replies__author')
            serializer = CommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            data = request.data.copy()
            data['post'] = post.id
            serializer = CommentSerializer(data=data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentViewSet(viewsets.ModelViewSet):
    """
    PUT    /api/comments/<id>/  — edit comment (author only)
    DELETE /api/comments/<id>/  — soft delete comment (author only)
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(is_deleted=False).select_related('author')

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the author can delete this comment.')
        instance.is_deleted = True
        instance.save()


class ProjectViewSet(viewsets.ModelViewSet):
    """
    GET    /api/projects/           — list projects
    POST   /api/projects/           — create project
    GET    /api/projects/<id>/      — project detail (View button)
    PUT    /api/projects/<id>/      — update project
    DELETE /api/projects/<id>/      — delete project
    GET    /api/projects/my/        — projects in my teams
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'tags']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Project.objects.select_related('team', 'created_by')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=False, methods=['get'], url_path='my')
    def my_projects(self, request):
        """GET /api/projects/my/ — projects belonging to teams I'm in."""
        user_teams = request.user.teams.all()
        projects = Project.objects.filter(team__in=user_teams).select_related('team', 'created_by')
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
