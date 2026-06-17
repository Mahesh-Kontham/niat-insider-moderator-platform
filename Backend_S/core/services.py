"""
Services for Core App - Business Logic Layer
"""

from django.contrib.auth import authenticate
from django.core.signing import TimestampSigner
from django.utils import timezone
from datetime import timedelta
from core.models import CustomUser, ModeratorInvite, Campus
from utils.email import EmailService
from utils.constants import UserRole, ErrorMessages
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication Service"""
    
    @staticmethod
    def login(email, password):
        """
        Login user with email and password
        
        Returns:
            user: Authenticated user object
            error: Error message if authentication fails
        """
        try:
            user = authenticate(username=email, password=password)
            
            if not user:
                return None, ErrorMessages.INVALID_CREDENTIALS
            
            if not user.is_active:
                return None, 'User account is inactive'
            
            return user, None
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return None, 'Login failed'
    
    @staticmethod
    def get_user_profile(user):
        """Get user profile data"""
        return {
            'id': str(user.id),
            'email': user.email,
            'role': user.role,
            'campus': user.campus.name if user.campus else None,
            'is_active': user.is_active,
        }


class InviteService:
    """Moderator Invite Service"""
    
    SIGNER = TimestampSigner()
    
    @staticmethod
    def generate_token(email, campus_id):
        """
        Generate a signed token for moderator invite
        
        Returns:
            token: Signed token
        """
        payload = f"{email}:{campus_id}"
        token = InviteService.SIGNER.sign(payload)
        return token
    
    @staticmethod
    def verify_token(token, max_age=None):
        """
        Verify and decode invite token
        
        Args:
            token: Signed token
            max_age: Max age in seconds (default: 24 hours)
        
        Returns:
            (email, campus_id): Decoded values
            error: Error message if verification fails
        """
        if max_age is None:
            max_age = 86400  # 24 hours
        
        try:
            payload = InviteService.SIGNER.unsign(token, max_age=max_age)
            email, campus_id = payload.split(':')
            return email, campus_id, None
            
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return None, None, ErrorMessages.INVALID_TOKEN
    
    @staticmethod
    def create_invite(email, campus_id):
        """
        Create a moderator invite
        
        Args:
            email: Moderator email
            campus_id: Campus ID
        
        Returns:
            invite: Created invite object
            error: Error message if creation fails
        """
        try:
            # Verify campus exists
            campus = Campus.objects.get(id=campus_id)
            
            # Check if user already exists
            if CustomUser.objects.filter(email=email).exists():
                return None, 'Email already registered'
            
            # Clean up expired invites for this email and campus
            ModeratorInvite.objects.filter(email=email, campus=campus, expires_at__lte=timezone.now()).delete()
            
            # Prevent duplicate active invites for this email and campus
            if ModeratorInvite.objects.filter(email=email, campus=campus, is_used=False, expires_at__gt=timezone.now()).exists():
                return None, 'An active invitation already exists for this email and campus'
            
            # Generate token
            token = InviteService.generate_token(email, str(campus_id))
            
            # Create invite
            expires_at = timezone.now() + timedelta(hours=24)
            
            invite, created = ModeratorInvite.objects.update_or_create(
                email=email,
                campus=campus,
                defaults={
                    'token': token,
                    'expires_at': expires_at,
                    'is_used': False,
                }
            )
            
            return invite, None
            
        except Campus.DoesNotExist:
            return None, ErrorMessages.CAMPUS_NOT_FOUND
        except Exception as e:
            logger.error(f"Invite creation failed: {str(e)}")
            return None, 'Failed to create invite'
    
    @staticmethod
    def send_invite(email, campus_id):
        """
        Send moderator invite via email
        
        Args:
            email: Moderator email
            campus_id: Campus ID
        
        Returns:
            invite: Created invite object
            error: Error message if sending fails
        """
        try:
            # Create invite
            invite, error = InviteService.create_invite(email, campus_id)
            
            if error:
                return None, error
            
            # Send email
            campus = Campus.objects.get(id=campus_id)
            try:
                EmailService.send_invite_email(
                    email,
                    invite.token,
                    campus.name
                )
            except Exception as mail_error:
                logger.error(f"SMTP or mail delivery failed to {email}: {str(mail_error)}", exc_info=True)
                return None, "Failed to send invitation email due to a mail server error."
            
            return invite, None
            
        except Exception as e:
            logger.error(f"Send invite error: {str(e)}", exc_info=True)
            return None, 'Failed to send invite'
    
    @staticmethod
    def process_onboard(token, password):
        """
        Process moderator onboarding
        
        Args:
            token: Invite token
            password: New password
        
        Returns:
            user: Created user object
            error: Error message if onboarding fails
        """
        try:
            # Verify token
            email, campus_id, error = InviteService.verify_token(token)
            
            if error:
                return None, error
            
            # Get invite
            try:
                invite = ModeratorInvite.objects.get(
                    token=token,
                    email=email
                )
            except ModeratorInvite.DoesNotExist:
                return None, ErrorMessages.INVALID_TOKEN
            
            # Check if already used
            if invite.is_used:
                return None, 'Invite already used'
            
            # Check if expired
            if invite.is_expired():
                return None, 'Invite token expired'
            
            # Create user
            campus = Campus.objects.get(id=campus_id)
            
            user = CustomUser.objects.create_user(
                email=email,
                password=password,
                role=UserRole.MODERATOR,
                campus=campus,
                is_active=True
            )
            
            # Mark invite as used
            invite.is_used = True
            invite.used_at = timezone.now()
            invite.save()
            
            # Send welcome email
            EmailService.send_welcome_email(user.email, user.email)
            
            logger.info(f"User {email} onboarded successfully for {campus.name}")
            
            return user, None
            
        except Campus.DoesNotExist:
            return None, ErrorMessages.CAMPUS_NOT_FOUND
        except Exception as e:
            logger.error(f"Onboard error: {str(e)}")
            return None, 'Onboarding failed'
