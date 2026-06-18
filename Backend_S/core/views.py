"""
Views for Core App - Authentication and User Management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import HttpResponse
from django.contrib.auth import get_user_model

from core.models import CustomUser, ModeratorInvite, Campus
from core.serializers import (
    LoginSerializer,
    UserSerializer,
    OnboardSerializer,
    InviteEmailSerializer,
    ModeratorInviteSerializer,
    ChangePasswordSerializer,
    CampusSerializer
)
from core.services import AuthService, InviteService
from core.permissions import IsAdmin, IsAdminOrModerator
from utils.responses import APIResponse
from utils.constants import SuccessMessages, ErrorMessages


class LoginView(viewsets.ViewSet):
    """Login ViewSet"""
    
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        POST /api/auth/login
        
        Login with email and password
        """
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.validation_error(serializer.errors)
        
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'role': user.role,
                'campus': user.campus.name if user.campus else None,
            }
        }
        
        return APIResponse.success(
            data=response_data,
            message=SuccessMessages.LOGIN_SUCCESS
        )


class ProfileView(viewsets.ViewSet):
    """User Profile ViewSet"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        GET /api/auth/me
        
        Get current user profile
        """
        serializer = UserSerializer(request.user)
        return APIResponse.success(data=serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        POST /api/auth/change_password
        
        Change user password
        """
        serializer = ChangePasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.validation_error(serializer.errors)
        
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        # Verify old password
        if not user.check_password(old_password):
            return APIResponse.error(
                error='Invalid password',
                message='Old password is incorrect',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return APIResponse.success(message='Password changed successfully')


class OnboardView(viewsets.ViewSet):
    """Onboarding ViewSet for new moderators"""
    
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def onboard(self, request):
        """
        POST /api/auth/onboard
        
        Complete moderator onboarding with invite token
        """
        serializer = OnboardSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.validation_error(serializer.errors)
        
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        
        # Process onboarding
        user, error = InviteService.process_onboard(token, password)
        
        if error:
            return APIResponse.error(
                error='Onboarding failed',
                message=error,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        return APIResponse.success(
            message=SuccessMessages.ACCOUNT_CREATED
        )


class CampusViewSet(viewsets.ReadOnlyModelViewSet):
    """Campus ViewSet"""
    
    queryset = Campus.objects.all()
    serializer_class = CampusSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/auth/campus/
        
        List all campuses without pagination, wrapped in standard success response
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
User = get_user_model()

def create_admin(request):
    if User.objects.filter(email="admin@niat.com").exists():
        return HttpResponse("Superuser already exists!")

    User.objects.create_superuser(
        email="admin@niat.com",
        password="Admin@123"
    )

    return HttpResponse("Superuser created successfully!")