# backend/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    EmailTokenObtainPairView,   # ← replaces the default TokenObtainPairView
    RegisterView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserDetailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', EmailTokenObtainPairView.as_view(), name='auth-login'),  # ← updated
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Public user profiles
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
