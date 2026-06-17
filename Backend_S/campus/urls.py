"""
URL Configuration for Campus App
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from campus.views import CampusViewSet

router = DefaultRouter()
router.register('', CampusViewSet, basename='campus')

urlpatterns = [
    path('', include(router.urls)),
]
