# backend/users/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


# ── Custom login: accepts email OR username ───────────────────────────────────
# User.USERNAME_FIELD = 'email', so SimpleJWT expects { email, password }.
# This serializer also accepts a username and resolves it to the matching email,
# so the frontend can send either identifier.
class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Accepts { email, password } OR { username, password }.
    If the value sent in the 'email' field does NOT contain '@' we treat it as
    a username and look up the associated email so SimpleJWT can authenticate.
    """
    def validate(self, attrs):
        identifier = attrs.get(self.username_field, '')   # self.username_field == 'email'
        # If it looks like a username (no @), resolve it to the user's email
        if identifier and '@' not in identifier:
            try:
                user_obj = User.objects.get(username=identifier)
                attrs[self.username_field] = user_obj.email
            except User.DoesNotExist:
                pass  # Let the default validation raise "No active account found"
        return super().validate(attrs)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Creates a new user and returns JWT tokens immediately.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'})
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/   — get current user's profile
    PUT   /api/auth/me/   — update current user's profile
    PATCH /api/auth/me/   — partial update
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed successfully.'})


class UserDetailView(generics.RetrieveAPIView):
    """GET /api/users/<id>/ — view any user's public profile"""
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
