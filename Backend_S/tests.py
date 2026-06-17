"""
pytest configuration and fixtures for NIAT Insider tests
"""

import os
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'niat_moderator.settings')
django.setup()

import pytest
from django.test.utils import override_settings
from rest_framework.test import APIClient
from core.models import CustomUser, Campus
from utils.constants import UserRole


@pytest.fixture
def api_client():
    """Provide API client"""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    return CustomUser.objects.create_user(
        email='admin@test.com',
        password='Admin@123456',
        role=UserRole.ADMIN,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def campus(db):
    """Create a campus"""
    return Campus.objects.create(name='Test Campus')


@pytest.fixture
def moderator_user(db, campus):
    """Create a moderator user"""
    return CustomUser.objects.create_user(
        email='moderator@test.com',
        password='Moderator@123456',
        role=UserRole.MODERATOR,
        campus=campus
    )


@pytest.fixture
def authenticated_admin_client(api_client, admin_user):
    """Create authenticated client with admin token"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def authenticated_moderator_client(api_client, moderator_user):
    """Create authenticated client with moderator token"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(moderator_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.mark.django_db
class TestAuthenticationAPI:
    """Tests for authentication endpoints"""
    
    def test_login_success(self, api_client, admin_user):
        """Test successful login"""
        response = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'Admin@123456'
        })
        assert response.status_code == 200
        assert 'access' in response.json()['data']
        assert 'refresh' in response.json()['data']
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrong_password'
        })
        assert response.status_code == 400
    
    def test_get_profile(self, authenticated_admin_client, admin_user):
        """Test getting user profile"""
        response = authenticated_admin_client.get('/api/auth/me/')
        assert response.status_code == 200
        assert response.json()['data']['email'] == admin_user.email
    
    def test_unauthorized_access(self, api_client):
        """Test access without token"""
        response = api_client.get('/api/auth/me/')
        assert response.status_code == 401


@pytest.mark.django_db
class TestArticleAPI:
    """Tests for article endpoints"""
    
    def test_create_article(self, authenticated_admin_client, campus):
        """Test creating an article"""
        response = authenticated_admin_client.post('/api/articles/', {
            'title': 'Test Article',
            'body': 'This is test article content with more characters',
            'category': 'NEWS',
            'status': 'PUBLISHED'
        })
        assert response.status_code == 201
        assert response.json()['data']['title'] == 'Test Article'
    
    def test_list_articles(self, authenticated_admin_client, admin_user, campus):
        """Test listing articles"""
        from moderator.models import Article
        Article.objects.create(
            title='Test Article',
            body='Test content',
            category='NEWS',
            status='PUBLISHED',
            campus=campus,
            author=admin_user
        )
        response = authenticated_admin_client.get('/api/articles/')
        assert response.status_code == 200
        assert len(response.json()['data']) > 0
    
    def test_moderator_campus_scoped_access(self, authenticated_moderator_client, campus, moderator_user):
        """Test that moderators can only access their campus articles"""
        from moderator.models import Article
        
        # Create article in different campus
        other_campus = Campus.objects.create(name='Other Campus')
        other_user = CustomUser.objects.create_user(
            email='other@test.com',
            password='Other@123456',
            role=UserRole.MODERATOR,
            campus=other_campus
        )
        
        article = Article.objects.create(
            title='Other Campus Article',
            body='Test content',
            category='NEWS',
            status='PUBLISHED',
            campus=other_campus,
            author=other_user
        )
        
        response = authenticated_moderator_client.get(f'/api/articles/{article.id}/')
        assert response.status_code == 403


# Example test command
# pytest tests.py -v
# pytest tests.py::TestAuthenticationAPI::test_login_success -v
# pytest tests.py --cov=. --cov-report=html
