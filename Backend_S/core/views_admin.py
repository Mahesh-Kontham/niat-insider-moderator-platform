"""
Admin Views for Core App
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.models import CustomUser, ModeratorInvite
from core.serializers import (
    UserSerializer,
    InviteEmailSerializer,
    ModeratorInviteSerializer
)
from core.services import InviteService
from core.permissions import IsAdmin
from utils.responses import APIResponse
from utils.constants import SuccessMessages, ErrorMessages


class AdminInviteViewSet(viewsets.ViewSet):
    """Admin Invite Management ViewSet"""
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @action(detail=False, methods=['post'])
    def invite(self, request):
        """
        POST /api/admin/invite
        
        Send moderator invite (Admin only)
        """
        serializer = InviteEmailSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.validation_error(serializer.errors)
        
        email = serializer.validated_data['email']
        campus_id = serializer.validated_data['campus_id']
        
        # Send invite
        invite, error = InviteService.send_invite(email, str(campus_id))
        
        if error:
            status_code = status.HTTP_400_BAD_REQUEST
            if "mail server error" in error.lower() or "smtp" in error.lower():
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return APIResponse.error(
                error='Invite failed',
                message=error,
                status_code=status_code
            )
            
        # Build invite link
        from django.conf import settings
        invite_link = f"{settings.FRONTEND_URL}/onboard?token={invite.token}"
        
        data = {
            "invite_id": str(invite.id),
            "email": invite.email,
            "campus": invite.campus.name,
            "invite_link": invite_link
        }
        
        return APIResponse.success(
            data=data,
            message=SuccessMessages.INVITE_SENT,
            status_code=status.HTTP_201_CREATED
        )
        
    @action(detail=False, methods=['post'], url_path='resend-invite/(?P<invite_id>[^/.]+)')
    def resend_invite(self, request, invite_id=None):
        """
        POST /api/admin/resend-invite/{invite_id}/
        
        Resend a pending invite (Admin only)
        """
        try:
            invite = ModeratorInvite.objects.get(id=invite_id)
            
            if invite.is_used:
                return APIResponse.error(
                    error='Cannot resend',
                    message='Invite already used',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate a new token and update expiration
            from django.utils import timezone
            from datetime import timedelta
            from utils.email import EmailService
            import logging
            
            logger = logging.getLogger(__name__)
            
            new_token = InviteService.generate_token(invite.email, str(invite.campus.id))
            invite.token = new_token
            invite.expires_at = timezone.now() + timedelta(hours=24)
            invite.save()
            
            # Resend email
            try:
                EmailService.send_invite_email(
                    invite.email,
                    invite.token,
                    invite.campus.name
                )
            except Exception as mail_error:
                logger.error(f"Failed to resend invite email to {invite.email}: {str(mail_error)}", exc_info=True)
                return APIResponse.error(
                    error='SMTP Error',
                    message='Failed to send invitation email due to a mail server error.',
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            return APIResponse.success(message='Invite resent successfully')
            
        except ModeratorInvite.DoesNotExist:
            return APIResponse.not_found('Invite not found')
    
    @action(detail=False, methods=['get'])
    def list_moderators(self, request):
        """
        GET /api/admin/list_moderators
        
        List all moderators (Admin only)
        """
        moderators = CustomUser.objects.filter(role='MODERATOR')
        serializer = UserSerializer(moderators, many=True)
        
        return APIResponse.success(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def list_invites(self, request):
        """
        GET /api/admin/list_invites
        
        List all pending invites (Admin only)
        """
        invites = ModeratorInvite.objects.filter(is_used=False)
        serializer = ModeratorInviteSerializer(invites, many=True)
        
        return APIResponse.success(data=serializer.data)
    
    @action(detail=False, methods=['delete'], url_path='revoke_invite/(?P<invite_id>[^/.]+)')
    def revoke_invite(self, request, invite_id=None):
        """
        DELETE /api/admin/revoke_invite/{invite_id}
        
        Revoke a pending invite (Admin only)
        """
        try:
            invite = ModeratorInvite.objects.get(id=invite_id)
            
            if invite.is_used:
                return APIResponse.error(
                    error='Cannot revoke',
                    message='Invite already used',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            invite.delete()
            
            return APIResponse.success(message='Invite revoked successfully')
            
        except ModeratorInvite.DoesNotExist:
            return APIResponse.not_found(ErrorMessages.INVALID_TOKEN)
