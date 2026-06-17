"""
Serializers for Moderator App - Article Management
"""

from rest_framework import serializers
from moderator.models import Article
from core.models import CustomUser, Campus
from utils.constants import ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE


class ArticleListSerializer(serializers.ModelSerializer):
    """Article List Serializer"""
    
    author_name = serializers.CharField(source='author.email', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'category', 'status',
            'author_name', 'campus_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Article Detail Serializer"""
    
    author_name = serializers.CharField(source='author.email', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'body', 'category', 'status',
            'image', 'author_name', 'campus_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author_name', 'campus_name',
            'created_at', 'updated_at'
        ]


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """Article Create/Update Serializer"""
    
    class Meta:
        model = Article
        fields = ['title', 'body', 'category', 'status', 'image']
    
    def validate_image(self, value):
        """Validate image file"""
        if value:
            # Check file size
            if value.size > MAX_IMAGE_SIZE:
                raise serializers.ValidationError(
                    f'Image size must not exceed {MAX_IMAGE_SIZE / (1024*1024)}MB'
                )
            
            # Check file extension
            file_extension = value.name.split('.')[-1].lower()
            if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
                raise serializers.ValidationError(
                    f'Allowed formats: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'
                )
        
        return value
    
    def validate_title(self, value):
        """Validate title"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters')
        return value
    
    def validate_body(self, value):
        """Validate body"""
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError('Body must be at least 10 characters')
        return value


class CampusArticleSerializer(serializers.ModelSerializer):
    """Campus Articles Serializer"""
    
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Campus
        fields = ['id', 'name', 'article_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_article_count(self, obj):
        return obj.articles.count()
