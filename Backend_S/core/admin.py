"""
Django Admin Configuration for Core App
"""

from django.contrib import admin
from core.form import CustomUserAdminForm
from core.models import CustomUser, Campus, ModeratorInvite


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    form = CustomUserAdminForm
    list_display = ['email', 'role', 'campus', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['email', 'campus__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Personal Info', {'fields': ['id', 'email' , 'password']}),
        ('Role & Permissions', {'fields': ['role', 'campus', 'is_active', 'is_staff', 'is_superuser']}),
        ('Timestamps', {'fields': ['created_at', 'updated_at'], 'classes': ['collapse']}),
    )


@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']
    readonly_fields = ['id', 'created_at']


@admin.register(ModeratorInvite)
class ModeratorInviteAdmin(admin.ModelAdmin):
    list_display = ['email', 'campus', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used', 'campus', 'created_at']
    search_fields = ['email', 'campus__name']
    readonly_fields = ['id', 'token', 'created_at', 'used_at']
