"""
Services for Moderator App - Article Business Logic
"""

from moderator.models import Article
from core.models import Campus
from utils.constants import UserRole, ErrorMessages
import logging

logger = logging.getLogger(__name__)


class ArticleService:
    """Article Management Service"""
    
    @staticmethod
    def get_articles_for_user(user):
        """
        Get articles based on user role
        
        Admin: All articles
        Moderator: Only articles from their campus
        """
        if user.role == UserRole.ADMIN:
            return Article.objects.all()
        
        if user.role == UserRole.MODERATOR:
            if not user.campus:
                return Article.objects.none()
            return Article.objects.filter(campus=user.campus)
        
        return Article.objects.none()
    
    @staticmethod
    def create_article(user, data):
        """
        Create a new article
        
        Args:
            user: Author user object
            data: Article data (title, body, category, status, image)
        
        Returns:
            article: Created article object
            error: Error message if creation fails
        """
        try:
            if user.role == UserRole.MODERATOR and not user.campus:
                return None, 'User not assigned to any campus'
            
            # Determine campus
            campus = user.campus if user.role == UserRole.MODERATOR else Campus.objects.first()
            
            if not campus:
                return None, ErrorMessages.CAMPUS_NOT_FOUND
            
            # Create article
            article = Article.objects.create(
                title=data.get('title'),
                body=data.get('body'),
                category=data.get('category'),
                status=data.get('status'),
                image=data.get('image'),
                campus=campus,
                author=user
            )
            
            logger.info(f"Article '{article.title}' created by {user.email}")
            return article, None
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.exception("Article Creation Failed")
            return None, str(e)
    
    @staticmethod
    def update_article(article, data, user):
        """
        Update an article
        
        Args:
            article: Article object to update
            data: Update data
            user: User making the update
        
        Returns:
            article: Updated article object
            error: Error message if update fails
        """
        try:
            # Check permission
            if user.role == UserRole.MODERATOR:
                if article.campus_id != user.campus_id:
                    return None, ErrorMessages.PERMISSION_DENIED
            
            # Update fields
            if 'title' in data:
                article.title = data['title']
            if 'body' in data:
                article.body = data['body']
            if 'category' in data:
                article.category = data['category']
            if 'status' in data:
                article.status = data['status']
            if 'image' in data and data['image']:
                article.image = data['image']
            
            article.save()
            
            logger.info(f"Article '{article.title}' updated")
            return article, None
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.exception("Article Update Failed")
            return None, str(e)
    
    @staticmethod
    def delete_article(article, user):
        """
        Delete an article
        
        Args:
            article: Article object to delete
            user: User making the deletion
        
        Returns:
            success: Boolean
            error: Error message if deletion fails
        """
        try:
            # Check permission
            if user.role == UserRole.MODERATOR:
                if article.campus_id != user.campus_id:
                    return False, ErrorMessages.PERMISSION_DENIED
            
            article_title = article.title
            article.delete()
            
            logger.info(f"Article '{article_title}' deleted")
            return True, None
            
        except Exception as e:
            logger.error(f"Article deletion failed: {str(e)}")
            return False, 'Failed to delete article'
