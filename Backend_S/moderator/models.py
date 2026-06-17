"""
Models for Moderator App - Article Management
"""

from django.db import models
from core.models import CustomUser, Campus
from utils.constants import ArticleStatus, ArticleCategory
import uuid


class Article(models.Model):
    """Article Model"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    body = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=ArticleCategory.CHOICES,
        default=ArticleCategory.OTHER
    )
    image = models.ImageField(
        upload_to='articles/%Y/%m/%d/',
        null=True,
        blank=True
    )
    campus = models.ForeignKey(
        Campus,
        on_delete=models.CASCADE,
        related_name='articles'
    )
    author = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles'
    )
    status = models.CharField(
        max_length=20,
        choices=ArticleStatus.CHOICES,
        default=ArticleStatus.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['campus', '-created_at']),
            models.Index(fields=['status', 'campus']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.campus.name}"
    
    def is_published(self):
        return self.status == ArticleStatus.PUBLISHED
