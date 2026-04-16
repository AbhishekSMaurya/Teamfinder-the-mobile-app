from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404

from .models import Team, TeamMembership, TeamJoinRequest
from .serializers import TeamSerializer, TeamMembershipSerializer, TeamJoinRequestSerializer


class TeamViewSet(ModelViewSet):
    """
    GET    /api/teams/           — list all open teams (Explore screen)
    POST   /api/teams/           — create a new team
    GET    /api/teams/<id>/      — team detail
    PUT    /api/teams/<id>/      — update team (owner/admin only)
    DELETE /api/teams/<id>/      — delete team (owner only)
    GET    /api/teams/my/        — teams the current user belongs to
    POST   /api/teams/<id>/join/ — join an open team
    POST   /api/teams/<id>/leave/— leave a team
    """
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Team.objects.all()
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('q')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=False, methods=['get'], url_path='my')
    def my_teams(self, request):
        """GET /api/teams/my/ — returns teams the current user is in."""
        teams = Team.objects.filter(members=request.user)
        serializer = self.get_serializer(teams, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='join')
    def join(self, request, pk=None):
        """POST /api/teams/<id>/join/"""
        team = self.get_object()
        if team.members.filter(id=request.user.id).exists():
            return Response({'detail': 'Already a member.'}, status=status.HTTP_400_BAD_REQUEST)

        if team.status == 'open':
            TeamMembership.objects.create(team=team, user=request.user, role='member')
            return Response({'detail': 'Joined successfully.'})
        elif team.status == 'closed':
            # Create a join request instead
            obj, created = TeamJoinRequest.objects.get_or_create(
                team=team, user=request.user,
                defaults={'message': request.data.get('message', '')}
            )
            if not created:
                return Response({'detail': 'Join request already sent.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'detail': 'Join request sent.'}, status=status.HTTP_201_CREATED)
        return Response({'detail': 'Team is archived.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        """POST /api/teams/<id>/leave/"""
        team = self.get_object()
        membership = TeamMembership.objects.filter(team=team, user=request.user).first()
        if not membership:
            return Response({'detail': 'Not a member.'}, status=status.HTTP_400_BAD_REQUEST)
        if membership.role == 'owner':
            return Response({'detail': 'Owner cannot leave. Transfer ownership first.'}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        return Response({'detail': 'Left team successfully.'})

    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, pk=None):
        """GET /api/teams/<id>/members/"""
        team = self.get_object()
        memberships = team.memberships.select_related('user').all()
        serializer = TeamMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
