"""
Email Service for sending emails via SMTP
"""

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def send_invite_email(recipient_email, token, campus_name):
        """
        Send moderator invite email with magic link
        
        Args:
            recipient_email: Email address of moderator
            token: Signed token for invite
            campus_name: Name of the campus
        """
        try:
            invite_link = f"{settings.FRONTEND_URL}/onboard?token={token}"
            
            subject = f"Welcome to NIAT Insider - {campus_name} Moderator Invite"
            
            # HTML Email Content
            html_message = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Welcome to NIAT Insider Moderator Platform</h2>
                    <p>Hello,</p>
                    <p>You have been invited as a moderator for the <strong>{campus_name}</strong> campus.</p>
                    <p>Click the link below to set up your account:</p>
                    <p>
                        <a href="{invite_link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Accept Invite
                        </a>
                    </p>
                    <p>Or copy this link: {invite_link}</p>
                    <p><strong>Note:</strong> This link expires in 24 hours.</p>
                    <p>Best regards,<br>NIAT Insider Team</p>
                </body>
            </html>
            """
            
            plain_message = f"""
            Welcome to NIAT Insider Moderator Platform
            
            You have been invited as a moderator for {campus_name}.
            
            Click the link to set up your account: {invite_link}
            
            This link expires in 24 hours.
            
            Best regards,
            NIAT Insider Team
            """
            
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Invite email sent to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send invite email to {recipient_email}: {str(e)}")
            raise e
    
    @staticmethod
    def send_welcome_email(user_email, user_name):
        """
        Send welcome email to new user
        
        Args:
            user_email: Email address of user
            user_name: Name of user
        """
        try:
            subject = "Welcome to NIAT Insider Moderator Platform"
            
            html_message = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Welcome, {user_name}!</h2>
                    <p>Your account has been successfully created.</p>
                    <p>You can now login to the NIAT Insider Moderator Platform and start managing articles for your campus.</p>
                    <p><a href="{settings.FRONTEND_URL}/login" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
                    <p>Best regards,<br>NIAT Insider Team</p>
                </body>
            </html>
            """
            
            plain_message = f"""
            Welcome, {user_name}!
            
            Your account has been successfully created.
            You can now login and start managing articles.
            
            Visit: {settings.FRONTEND_URL}/login
            
            Best regards,
            NIAT Insider Team
            """
            
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Welcome email sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user_email}: {str(e)}")
            return False
