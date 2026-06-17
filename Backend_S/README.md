# NIAT Insider Moderator Platform - Backend

Production-ready Django REST Framework backend for the NIAT Insider Moderator Platform.

## Project Overview

This is a comprehensive Django REST Framework application built for managing campus-based content moderation. It provides:

- **User Management**: Custom user model with role-based access control (Admin, Moderator)
- **JWT Authentication**: Secure token-based authentication with SimpleJWT
- **Campus Management**: Multi-campus support with moderators assigned to specific campuses
- **Article Management**: Full CRUD operations for articles with status and category management
- **Moderator Invitations**: Magic link-based invitation system with email notifications
- **Permission System**: Campus-scoped access control and role-based permissions

## Technology Stack

- **Django 5+**: Web framework
- **Django REST Framework**: REST API development
- **PostgreSQL**: Database (configurable)
- **SimpleJWT**: JWT authentication
- **Pillow**: Image upload support
- **django-environ**: Environment variable management
- **django-cors-headers**: CORS support
- **django-filter**: Advanced filtering

## Project Structure

```
Backend/
├── niat_moderator/          # Main project settings
│   ├── settings.py          # Django configuration
│   ├── urls.py              # Main URL router
│   └── wsgi.py              # WSGI application
├── core/                    # Authentication & User Management
│   ├── models.py            # User, Campus, ModeratorInvite models
│   ├── serializers.py       # API serializers
│   ├── views.py             # Authentication views
│   ├── views_admin.py       # Admin-only views
│   ├── permissions.py       # Custom permissions
│   ├── services.py          # Business logic
│   ├── urls.py              # Core app routes
│   └── admin.py             # Django admin
├── moderator/               # Article Management
│   ├── models.py            # Article model
│   ├── serializers.py       # Article serializers
│   ├── views.py             # Article views
│   ├── permissions.py       # Article permissions
│   ├── services.py          # Article logic
│   ├── urls.py              # Article routes
│   └── admin.py             # Django admin
├── campus/                  # Campus Management
│   ├── models.py            # Campus model references
│   ├── serializers.py       # Campus serializers
│   ├── views.py             # Campus views
│   ├── urls.py              # Campus routes
│   └── admin.py             # Django admin
├── utils/                   # Utilities & Helpers
│   ├── constants.py         # Application constants
│   ├── responses.py         # Standardized API responses
│   └── email.py             # Email service
├── media/                   # User uploads
│   └── articles/            # Article images
├── manage.py                # Django management
├── requirements.txt         # Python dependencies
├── .env.example             # Environment template
└── README.md                # This file
```

## Installation & Setup

### 1. Prerequisites

- Python 3.10+
- PostgreSQL (or SQLite for development)
- pip & virtualenv

### 2. Clone & Setup Environment

```bash
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Database Setup

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Seed Initial Data

```bash
python manage.py seed_admin --admin-email admin@test.com --admin-password Admin@123456
```

### 7. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 8. Run Development Server

```bash
python manage.py runserver
```

Server will be available at `http://localhost:8000`

## Database Models

### Campus
```python
- id (UUID)
- name (String, unique)
- created_at (DateTime)
```

### CustomUser (extends AbstractBaseUser)
```python
- id (UUID)
- email (String, unique)
- password (String, hashed)
- role (ADMIN | MODERATOR)
- campus (FK to Campus, nullable)
- is_active (Boolean)
- is_staff (Boolean)
- created_at (DateTime)
- updated_at (DateTime)
```

### ModeratorInvite
```python
- id (UUID)
- email (String)
- campus (FK to Campus)
- token (String, signed)
- expires_at (DateTime)
- is_used (Boolean)
- used_at (DateTime, nullable)
- created_at (DateTime)
```

### Article
```python
- id (UUID)
- title (String)
- body (Text)
- category (NEWS | EVENT | ANNOUNCEMENT | FEATURE | OTHER)
- image (ImageField, nullable)
- campus (FK to Campus)
- author (FK to CustomUser)
- status (DRAFT | PUBLISHED)
- created_at (DateTime)
- updated_at (DateTime)
```

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "password123"
}

Response 200:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access": "jwt-token",
    "refresh": "jwt-refresh",
    "user": {
      "id": "uuid",
      "email": "admin@test.com",
      "role": "ADMIN",
      "campus": null
    }
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {access_token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "uuid",
    "email": "admin@test.com",
    "role": "ADMIN",
    "campus": null,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "old_password": "current_password",
  "new_password": "NewPassword@123",
  "confirm_password": "NewPassword@123"
}

Response 200:
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

#### Onboard New Moderator
```http
POST /api/auth/onboard
Content-Type: application/json

{
  "token": "signed-token",
  "password": "Password@123",
  "confirm_password": "Password@123"
}

Response 200:
{
  "success": true,
  "message": "Account created successfully",
  "data": null
}
```

### Admin Operations

#### Send Moderator Invite
```http
POST /api/admin/invite
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "moderator@test.com",
  "campus_id": "campus-uuid"
}

Response 201:
{
  "success": true,
  "message": "Invite sent successfully",
  "data": null
}
```

#### List All Moderators
```http
GET /api/admin/list-moderators
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "email": "moderator@test.com",
      "role": "MODERATOR",
      "campus": "uuid",
      "campus_name": "Chennai",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### List All Invites
```http
GET /api/admin/list-invites
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "email": "moderator@test.com",
      "campus": "uuid",
      "campus_name": "Chennai",
      "expires_at": "2024-01-16T10:30:00Z",
      "is_used": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Revoke Invite
```http
DELETE /api/admin/revoke-invite/{invite_id}
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "message": "Invite revoked successfully",
  "data": null
}
```

### Article Management

#### List Articles
```http
GET /api/articles/
Authorization: Bearer {token}

Query Parameters:
- category=NEWS
- status=PUBLISHED
- search=announcement
- page=1
- ordering=-created_at

Response 200:
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "title": "Campus Event",
      "category": "EVENT",
      "status": "PUBLISHED",
      "author_name": "moderator@test.com",
      "campus_name": "Chennai",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Article
```http
POST /api/articles/
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- title: "Article Title"
- body: "Article content here..."
- category: "NEWS"
- status: "PUBLISHED"
- image: (file upload, optional)

Response 201:
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "id": "uuid",
    "title": "Article Title",
    "body": "Article content here...",
    "category": "NEWS",
    "status": "PUBLISHED",
    "image": "/media/articles/2024/01/15/image.jpg",
    "author_name": "moderator@test.com",
    "campus_name": "Chennai",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Article Details
```http
GET /api/articles/{article_id}/
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "uuid",
    "title": "Article Title",
    "body": "Article content here...",
    "category": "NEWS",
    "status": "PUBLISHED",
    "image": "/media/articles/2024/01/15/image.jpg",
    "author_name": "moderator@test.com",
    "campus_name": "Chennai",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Update Article
```http
PUT /api/articles/{article_id}/
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data (all optional):
- title: "Updated Title"
- body: "Updated content..."
- category: "EVENT"
- status: "DRAFT"
- image: (file upload)

Response 200:
{
  "success": true,
  "message": "Article updated successfully",
  "data": { ... }
}
```

#### Delete Article
```http
DELETE /api/articles/{article_id}/
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Article deleted successfully",
  "data": null
}
```

#### Get Published Articles
```http
GET /api/articles/published/
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": [ ... ]
}
```

#### Get Draft Articles
```http
GET /api/articles/drafts/
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": [ ... ]
}
```

### Campus Management

#### List All Campuses
```http
GET /api/auth/campus/
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "name": "Chennai",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### List Campuses with Article Count
```http
GET /api/campus/with-articles/
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "name": "Chennai",
      "article_count": 15,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Permissions

### IsAdmin
Allows only users with ADMIN role.

### IsModerator
Allows only users with MODERATOR role.

### CampusScopedPermission
- **Admin**: Full access to all campus articles
- **Moderator**: Access only to articles from their assigned campus

### IsArticleAuthorOrAdmin
- **Admin**: Can edit/delete any article
- **Author**: Can edit/delete their own articles

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Validation error",
  "errors": {
    "email": ["This field may not be blank."]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Not found"
}
```

## Environment Variables

See `.env.example` for all configuration options:

```env
# Django
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=niat_moderator_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_LIFETIME=900
JWT_REFRESH_TOKEN_LIFETIME=604800

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-password
DEFAULT_FROM_EMAIL=noreply@niatinsider.com

# Frontend
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Development

### Run Tests
```bash
python manage.py test
```

### Create Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Access Admin Panel
```
http://localhost:8000/admin/
```

## Production Deployment

### Checklist
- [ ] Set `DEBUG=False` in `.env`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure PostgreSQL database
- [ ] Setup email service (SMTP)
- [ ] Configure static files serving
- [ ] Setup media files serving
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Setup logging and monitoring
- [ ] Run migrations on production
- [ ] Collect static files: `python manage.py collectstatic`

### Using Gunicorn
```bash
pip install gunicorn
gunicorn niat_moderator.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker
Create a `Dockerfile`:
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "niat_moderator.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Security Best Practices

- Use environment variables for sensitive data
- Enable HTTPS in production
- Set `SECURE_SSL_REDIRECT=True`
- Use strong password policies
- Implement rate limiting
- Enable CORS only for trusted origins
- Regularly update dependencies
- Use strong JWT secret keys
- Implement proper logging and monitoring

## Support & Documentation

For issues or questions, please refer to:
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [SimpleJWT Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)

## License

This project is part of the NIAT Insider Platform.
