"""
Serializers for Core App - Authentication and User Management
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import EmailValidator
from core.models import CustomUser, Campus, ModeratorInvite
from utils.constants import ErrorMessages, UserRole


class CampusSerializer(serializers.ModelSerializer):
    """Campus Serializer"""
    
    class Meta:
        model = Campus
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    """User Serializer"""
    
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'role', 'campus', 'campus_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class LoginSerializer(serializers.Serializer):
    """Login Serializer"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        user = authenticate(username=email, password=password)
        
        if not user:
            raise serializers.ValidationError(ErrorMessages.INVALID_CREDENTIALS)
        
        if not user.is_active:
            raise serializers.ValidationError('User account is inactive')
        
        data['user'] = user
        return data


class OnboardSerializer(serializers.Serializer):
    """Onboarding Serializer for new moderators"""
    
    token = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        # Validate password strength
        if not self._is_strong_password(data['password']):
            raise serializers.ValidationError({
                'password': 'Password must contain uppercase, lowercase, number, and special character'
            })
        
        return data
    
    @staticmethod
    def _is_strong_password(password):
        """Validate password strength"""
        import re
        
        has_upper = re.search(r'[A-Z]', password)
        has_lower = re.search(r'[a-z]', password)
        has_digit = re.search(r'\d', password)
        has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
        
        return has_upper and has_lower and has_digit and has_special


class ModeratorInviteSerializer(serializers.ModelSerializer):
    """Moderator Invite Serializer"""
    
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    
    class Meta:
        model = ModeratorInvite
        fields = ['id', 'email', 'campus', 'campus_name', 'expires_at', 'is_used', 'created_at']
        read_only_fields = ['id', 'token', 'expires_at', 'is_used', 'created_at']


class InviteEmailSerializer(serializers.Serializer):
    """Serializer for sending invite emails"""
    
    email = serializers.EmailField()
    campus_id = serializers.UUIDField()
    
    def validate_email(self, value):
        # Check if user already exists
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered as a user')
        
        return value
    
    def validate_campus_id(self, value):
        if not Campus.objects.filter(id=value).exists():
            raise serializers.ValidationError(ErrorMessages.CAMPUS_NOT_FOUND)
        
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8
    )
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        return data
