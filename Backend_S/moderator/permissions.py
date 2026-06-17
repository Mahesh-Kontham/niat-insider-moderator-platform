"""
Custom Permissions for Moderator App
"""

from rest_framework import permissions
from utils.constants import UserRole


class CampusScopedPermission(permissions.BasePermission):
    """
    Permission to enforce campus-scoped access.
    
    Admins can access any campus article.
    Moderators can access only articles from their campus.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can access any article
        if request.user.role == UserRole.ADMIN:
            return True
        
        # Moderator can access only articles from their campus
        if request.user.role == UserRole.MODERATOR:
            return obj.campus_id == request.user.campus_id
        
        return False


class IsArticleAuthorOrAdmin(permissions.BasePermission):
    """
    Permission for article editing and deletion.
    Only the author (moderator) or admin can edit/delete.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin can edit/delete any article
        if request.user.role == UserRole.ADMIN:
            return True
        
        # Article author (moderator) can edit/delete their own article
        if obj.author_id == request.user.id:
            return True
        
        return False
