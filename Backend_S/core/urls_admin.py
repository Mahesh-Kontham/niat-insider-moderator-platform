"""
URL Configuration for Admin endpoints in Core App
"""

from django.urls import path
from core.views_admin import AdminInviteViewSet

urlpatterns = [
    path('invite/', AdminInviteViewSet.as_view({'post': 'invite'}), name='admin-invite'),
    path('list-moderators/', AdminInviteViewSet.as_view({'get': 'list_moderators'}), name='list-moderators'),
    path('list-invites/', AdminInviteViewSet.as_view({'get': 'list_invites'}), name='list-invites'),
    path('revoke-invite/<str:invite_id>/', AdminInviteViewSet.as_view({'delete': 'revoke_invite'}), name='revoke-invite'),
    path('resend-invite/<str:invite_id>/', AdminInviteViewSet.as_view({'post': 'resend_invite'}), name='resend-invite'),
]
