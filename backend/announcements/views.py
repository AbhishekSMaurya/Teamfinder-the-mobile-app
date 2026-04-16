from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Announcement
from .serializers import AnnouncementSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    GET    /api/announcements/        — list all active announcements
    POST   /api/announcements/        — create announcement
    GET    /api/announcements/<id>/   — detail
    PUT    /api/announcements/<id>/   — update (author only)
    DELETE /api/announcements/<id>/   — delete (author only)
    GET    /api/announcements/mine/   — announcements by current user
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Announcement.objects.filter(is_archived=False).select_related('author', 'team')
        tag = self.request.query_params.get('tag')
        if tag:
            # Filter by tag — works for JSONField containing a list
            queryset = queryset.filter(tags__contains=tag)
        return queryset

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_update(self, serializer):
        # Only the author can update
        instance = self.get_object()
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the author can edit this announcement.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the author can delete this announcement.')
        instance.is_archived = True
        instance.save()

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        """GET /api/announcements/mine/"""
        announcements = Announcement.objects.filter(author=request.user, is_archived=False)
        serializer = self.get_serializer(announcements, many=True)
        return Response(serializer.data)
