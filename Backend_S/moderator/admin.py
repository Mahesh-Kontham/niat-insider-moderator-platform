"""
Django Admin Configuration for Moderator App
"""

from django.contrib import admin
from moderator.models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'campus', 'author', 'created_at']
    list_filter = ['status', 'category', 'campus', 'created_at']
    search_fields = ['title', 'body', 'campus__name', 'author__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Article Info', {'fields': ['id', 'title', 'body', 'category']}),
        ('Metadata', {'fields': ['status', 'image', 'campus', 'author']}),
        ('Timestamps', {'fields': ['created_at', 'updated_at'], 'classes': ['collapse']}),
    )
