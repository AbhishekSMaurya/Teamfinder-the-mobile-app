# backend/messaging/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ── Direct Messages ────────────────────────────────────────────────────
    path('conversations/',              views.DMConversationListView.as_view(),  name='dm-conversations'),
    path('dm/<int:user_id>/',           views.DMThreadView.as_view(),            name='dm-thread'),
    path('dm/<int:user_id>/poll/',      views.DMPollView.as_view(),              name='dm-poll'),
    path('users/search/',               views.UserSearchView.as_view(),          name='user-search'),

    # ── Group Chats ────────────────────────────────────────────────────────
    path('groups/',                     views.GroupChatListCreateView.as_view(), name='group-list-create'),
    path('groups/my/',                  views.MyGroupChatsView.as_view(),        name='my-groups'),
    path('groups/recommended/',         views.RecommendedGroupsView.as_view(),   name='recommended-groups'),
    path('groups/<int:pk>/',            views.GroupChatDetailView.as_view(),     name='group-detail'),
    path('groups/<int:pk>/members/',    views.GroupMembersView.as_view(),        name='group-members'),
    path('groups/<int:pk>/messages/',   views.GroupMessageListCreateView.as_view(), name='group-messages'),
    path('groups/<int:pk>/poll/',       views.GroupMessagePollView.as_view(),    name='group-poll'),
    path('groups/<int:pk>/<str:action>/', views.GroupJoinLeaveView.as_view(),   name='group-join-leave'),
]
