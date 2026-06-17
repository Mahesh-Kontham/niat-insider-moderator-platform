"""
URL Configuration for Core App
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import LoginView, ProfileView, OnboardView, CampusViewSet

router = DefaultRouter()
router.register('campus', CampusViewSet, basename='campus')

urlpatterns = [
    # Authentication endpoints
    path('login/', LoginView.as_view({'post': 'login'}), name='login'),
    path('me/', ProfileView.as_view({'get': 'me'}), name='profile'),
    path('change-password/', ProfileView.as_view({'post': 'change_password'}), name='change-password'),
    path('onboard/', OnboardView.as_view({'post': 'onboard'}), name='onboard'),
    
    # Campus endpoints
    path('', include(router.urls)),
]
