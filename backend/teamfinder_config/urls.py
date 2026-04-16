from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth & Users
    path('api/auth/', include('users.urls')),

    # Teams
    path('api/teams/', include('teams.urls')),

    # Announcements
    path('api/announcements/', include('announcements.urls')),

    # Posts, Comments, Projects
    path('api/', include('posts.urls')),
]

# Serve media files (avatars, images) in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
