"""
Constants for NIAT Insider Moderator Platform
"""

# User Roles
class UserRole:
    ADMIN = 'ADMIN'
    MODERATOR = 'MODERATOR'
    
    CHOICES = [
        (ADMIN, 'Admin'),
        (MODERATOR, 'Moderator'),
    ]


# Article Status
class ArticleStatus:
    DRAFT = 'DRAFT'
    PUBLISHED = 'PUBLISHED'
    
    CHOICES = [
        (DRAFT, 'Draft'),
        (PUBLISHED, 'Published'),
    ]


# Article Categories
class ArticleCategory:
    NEWS = 'NEWS'
    EVENT = 'EVENT'
    ANNOUNCEMENT = 'ANNOUNCEMENT'
    FEATURE = 'FEATURE'
    OTHER = 'OTHER'
    
    CHOICES = [
        (NEWS, 'News'),
        (EVENT, 'Event'),
        (ANNOUNCEMENT, 'Announcement'),
        (FEATURE, 'Feature'),
        (OTHER, 'Other'),
    ]


# Error Messages
class ErrorMessages:
    INVALID_CREDENTIALS = 'Invalid email or password'
    EMAIL_ALREADY_EXISTS = 'Email already registered'
    USER_NOT_FOUND = 'User not found'
    CAMPUS_NOT_FOUND = 'Campus not found'
    ARTICLE_NOT_FOUND = 'Article not found'
    PERMISSION_DENIED = 'Permission denied'
    INVALID_TOKEN = 'Invalid or expired token'
    INVALID_FILE_TYPE = 'Invalid file type'
    FILE_TOO_LARGE = 'File too large'
    WEAK_PASSWORD = 'Password does not meet requirements'


# Success Messages
class SuccessMessages:
    INVITE_SENT = 'Invite sent successfully'
    ACCOUNT_CREATED = 'Account created successfully'
    LOGIN_SUCCESS = 'Login successful'
    ARTICLE_CREATED = 'Article created successfully'
    ARTICLE_UPDATED = 'Article updated successfully'
    ARTICLE_DELETED = 'Article deleted successfully'


# Allowed File Extensions
ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png']
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
