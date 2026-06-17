"""
Views for Moderator App - Article Management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from moderator.models import Article
from moderator.serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer
)
from moderator.services import ArticleService
from moderator.permissions import CampusScopedPermission, IsArticleAuthorOrAdmin
from core.permissions import IsAdminOrModerator
from utils.responses import APIResponse
from utils.constants import SuccessMessages, ErrorMessages, ArticleStatus


class ArticleViewSet(viewsets.ModelViewSet):
    """Article ViewSet for CRUD operations"""
    
    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]
    serializer_class = ArticleListSerializer
    permission_classes = [IsAuthenticated, IsAdminOrModerator, CampusScopedPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'category', 'campus']
    search_fields = ['title', 'body', 'category']
    ordering_fields = ['created_at', 'title', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get articles based on user role"""
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return Article.objects.all()
        return ArticleService.get_articles_for_user(self.request.user)
        
    def list(self, request, *args, **kwargs):
        """
        GET /api/articles/
        
        List articles with optional filtering, search, and pagination.
        Pagination metadata is added to response headers.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = APIResponse.success(data=serializer.data)
            
            # Set pagination info in headers
            try:
                response['X-Total-Count'] = str(self.paginator.page.paginator.count)
                response['X-Page-Size'] = str(self.paginator.page.paginator.per_page)
                response['X-Current-Page'] = str(self.paginator.page.number)
                response['X-Total-Pages'] = str(self.paginator.page.paginator.num_pages)
                
                links = []
                if self.paginator.get_next_link():
                    links.append(f'<{self.paginator.get_next_link()}>; rel="next"')
                if self.paginator.get_previous_link():
                    links.append(f'<{self.paginator.get_previous_link()}>; rel="prev"')
                if links:
                    response['Link'] = ', '.join(links)
            except Exception as e:
                pass
                
            return response
            
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateUpdateSerializer
        if self.action == 'retrieve':
            return ArticleDetailSerializer
        return ArticleListSerializer
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/articles/
        
        Create a new article
        """
        print("request.data:", request.data)
        print("request.FILES:", request.FILES)
        if request.user and request.user.is_authenticated:
            print(f"request.user.email: {request.user.email}")
            print(f"request.user.role: {request.user.role}")
            print(f"request.user.campus: {request.user.campus}")
            
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("serializer.errors:", serializer.errors)
            return APIResponse.validation_error(serializer.errors)
        
        print("serializer.validated_data:", serializer.validated_data)
        # Create article via service
        article, error = ArticleService.create_article(
            request.user,
            serializer.validated_data
        )
        
        if error:
            print("Article creation failed with error:", error)
            return APIResponse.error(
                error='Creation failed',
                message=error,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        print("created article:", article)
        output_serializer = ArticleDetailSerializer(article)
        
        return APIResponse.created(
            data=output_serializer.data,
            message=SuccessMessages.ARTICLE_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """
        PUT /api/articles/<id>/
        
        Update an article
        """
        article = self.get_object()
        
        # Check permission
        if not request.user.role == 'ADMIN':
            if article.author_id != request.user.id:
                return APIResponse.forbidden(ErrorMessages.PERMISSION_DENIED)
        
        print("request.data:", request.data)
        print("request.FILES:", request.FILES)
        if request.user and request.user.is_authenticated:
            print(f"request.user.email: {request.user.email}")
            print(f"request.user.role: {request.user.role}")
            print(f"request.user.campus: {request.user.campus}")
            
        serializer = self.get_serializer(data=request.data, partial=kwargs.get('partial', False))
        
        if not serializer.is_valid():
            print("serializer.errors:", serializer.errors)
            return APIResponse.validation_error(serializer.errors)
        
        print("serializer.validated_data:", serializer.validated_data)
        # Update article via service
        updated_article, error = ArticleService.update_article(
            article,
            serializer.validated_data,
            request.user
        )
        
        if error:
            return APIResponse.error(
                error='Update failed',
                message=error,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        output_serializer = ArticleDetailSerializer(updated_article)
        
        return APIResponse.success(
            data=output_serializer.data,
            message=SuccessMessages.ARTICLE_UPDATED
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/articles/<id>/
        
        Delete an article
        """
        article = self.get_object()
        
        # Delete article via service
        success, error = ArticleService.delete_article(article, request.user)
        
        if not success:
            return APIResponse.error(
                error='Deletion failed',
                message=error,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        return APIResponse.success(
            message=SuccessMessages.ARTICLE_DELETED
        )
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        """
        GET /api/articles/published/
        
        List published articles only
        """
        articles = self.get_queryset().filter(status=ArticleStatus.PUBLISHED)
        serializer = self.get_serializer(articles, many=True)
        
        return APIResponse.success(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def drafts(self, request):
        """
        GET /api/articles/drafts/
        
        List draft articles only
        """
        articles = self.get_queryset().filter(status=ArticleStatus.DRAFT)
        serializer = self.get_serializer(articles, many=True)
        
        return APIResponse.success(data=serializer.data)
