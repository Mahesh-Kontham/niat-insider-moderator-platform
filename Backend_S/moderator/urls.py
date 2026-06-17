"""
URL Configuration for Moderator App
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from moderator.views import ArticleViewSet

router = DefaultRouter()
router.register('', ArticleViewSet, basename='article')

urlpatterns = [
    path('', include(router.urls)),
    path('published/', ArticleViewSet.as_view({'get': 'published'}), name='published-articles'),
    path('drafts/', ArticleViewSet.as_view({'get': 'drafts'}), name='draft-articles'),
]
