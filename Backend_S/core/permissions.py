"""
Custom Permissions for Core App
"""

from rest_framework import permissions
from utils.constants import UserRole


class IsAdmin(permissions.BasePermission):
    """
    Permission to check if user is an admin
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.ADMIN
        )


class IsModerator(permissions.BasePermission):
    """
    Permission to check if user is a moderator
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.MODERATOR
        )


class IsAdminOrModerator(permissions.BasePermission):
    """
    Permission to check if user is admin or moderator
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.ADMIN, UserRole.MODERATOR]
        )
