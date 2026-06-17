# Architecture Overview

## Clean Architecture Principles

This backend follows clean architecture principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                  API Layer (Views)                  │
│         ├─ Authentication Views                     │
│         ├─ Article Views (ViewSets)                 │
│         └─ Admin Views                              │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│              Business Logic (Services)              │
│         ├─ AuthService                              │
│         ├─ InviteService                            │
│         └─ ArticleService                           │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│            Data Access (Models)                     │
│         ├─ CustomUser                               │
│         ├─ Campus                                   │
│         ├─ Article                                  │
│         └─ ModeratorInvite                          │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│              Database (PostgreSQL)                  │
└─────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Views Layer
- HTTP request handling
- Request validation via Serializers
- Permission checking
- Response formatting
- Business logic orchestration

**Location:** `{app}/views.py`, `{app}/views_admin.py`

### 2. Serializers Layer
- Request data validation
- Response data transformation
- Complex data serialization

**Location:** `{app}/serializers.py`

### 3. Permissions Layer
- Role-based access control
- Resource-based access control
- Campus-scoped access validation

**Location:** `{app}/permissions.py`

### 4. Services Layer
- Core business logic
- Service orchestration
- Email notifications
- Token management

**Location:** `{app}/services.py`

### 5. Models Layer
- Data structure definition
- Database schema
- Model methods and properties

**Location:** `{app}/models.py`

### 6. Utilities Layer
- Constants
- Standardized responses
- Email utilities

**Location:** `utils/`

## Module Organization

### Core App
Handles authentication and user management.

**Modules:**
- `models.py` - CustomUser, Campus, ModeratorInvite
- `serializers.py` - Authentication serializers
- `services.py` - AuthService, InviteService
- `views.py` - Authentication endpoints
- `views_admin.py` - Admin-only endpoints
- `permissions.py` - Auth permissions
- `urls.py` - Auth routes
- `admin.py` - Django admin configuration
- `management/commands/seed_admin.py` - Data seeding

### Moderator App
Handles article management.

**Modules:**
- `models.py` - Article model
- `serializers.py` - Article serializers
- `services.py` - ArticleService
- `views.py` - Article endpoints
- `permissions.py` - Article permissions
- `urls.py` - Article routes
- `admin.py` - Django admin configuration

### Campus App
Campus management and cross-campus data.

**Modules:**
- `models.py` - Campus model references
- `serializers.py` - Campus serializers
- `views.py` - Campus endpoints
- `urls.py` - Campus routes
- `admin.py` - Django admin configuration

### Utils
Shared utilities and helpers.

**Modules:**
- `constants.py` - Application constants
- `responses.py` - Standardized API responses
- `email.py` - Email service

## Request Flow

```
HTTP Request
     │
     ▼
URL Router (urls.py)
     │
     ▼
View (views.py)
     │
     ├─ Validate Permission (permissions.py)
     │
     ├─ Parse Request (serializers.py)
     │
     ├─ Call Service (services.py)
     │  │
     │  └─ Interact with Database (models.py)
     │
     ├─ Format Response (responses.py)
     │
     ▼
HTTP Response (JSON)
```

## Authentication Flow

```
Login Request
     │
     ▼
LoginView.login()
     │
     ├─ Validate serializer
     │
     ├─ Call AuthService.login()
     │  │
     │  └─ Authenticate with Django auth
     │
     ├─ Generate JWT tokens
     │  │
     │  └─ RefreshToken.for_user()
     │
     ├─ Build response with tokens
     │
     ▼
JWT Tokens Response
```

## Invitation Flow

```
POST /api/admin/invite/
     │
     ▼
AdminInviteViewSet.invite()
     │
     ├─ Check IsAdmin permission
     │
     ├─ Validate email & campus
     │
     ├─ Call InviteService.send_invite()
     │  │
     │  ├─ Create ModeratorInvite model
     │  │
     │  ├─ Generate signed token
     │  │
     │  └─ EmailService.send_invite_email()
     │
     ▼
Success Response
```

## Onboarding Flow

```
POST /api/auth/onboard/
     │
     ▼
OnboardView.onboard()
     │
     ├─ Validate token & password
     │
     ├─ Call InviteService.process_onboard()
     │  │
     │  ├─ Verify token signature
     │  │
     │  ├─ Check invite validity
     │  │
     │  ├─ Create CustomUser
     │  │
     │  ├─ Mark invite as used
     │  │
     │  └─ EmailService.send_welcome_email()
     │
     ▼
Success Response
```

## Article Management Flow

```
POST/PUT /api/articles/
     │
     ▼
ArticleViewSet.create/update()
     │
     ├─ Check IsAuthenticated
     │
     ├─ Check IsAdminOrModerator
     │
     ├─ Check CampusScopedPermission
     │
     ├─ Validate serializer
     │
     ├─ Call ArticleService.create_article()
     │  │
     │  └─ Create/Update Article model
     │
     ├─ Format response
     │
     ▼
Article Response
```

## Permission System

### Hierarchical Permissions

```
AllowAny
├─ Login, Onboard

IsAuthenticated
├─ All protected endpoints

IsAdmin
├─ Invite moderators
├─ View all moderators
├─ View all articles
└─ Delete any article

IsModerator
├─ Create/Edit own articles
└─ View campus articles

CampusScopedPermission
├─ Moderators: only their campus
└─ Admins: all campuses
```

## Database Schema

### Core Models

**CustomUser**
```python
id (UUID, PK)
email (String, Unique)
password (Hashed)
role (ADMIN|MODERATOR)
campus (FK Campus, nullable)
is_active (Boolean)
is_staff (Boolean)
created_at (DateTime)
updated_at (DateTime)
```

**Campus**
```python
id (UUID, PK)
name (String, Unique)
created_at (DateTime)
```

**ModeratorInvite**
```python
id (UUID, PK)
email (String)
campus (FK Campus)
token (String, Unique)
expires_at (DateTime)
is_used (Boolean)
used_at (DateTime, nullable)
created_at (DateTime)
Unique: (email, campus)
```

**Article**
```python
id (UUID, PK)
title (String)
body (Text)
category (String)
image (ImageField, nullable)
campus (FK Campus)
author (FK CustomUser)
status (DRAFT|PUBLISHED)
created_at (DateTime)
updated_at (DateTime)
Index: (campus, -created_at)
Index: (status, campus)
```

## Key Features

### 1. JWT Authentication
- Token-based authentication
- 15-minute access token lifetime
- 7-day refresh token lifetime
- Secure token signing

### 2. Email Notifications
- Moderator invite emails
- Welcome emails
- Configurable SMTP
- HTML email templates

### 3. Image Uploads
- Article image support
- Validation (format, size)
- Organized storage structure
- Media URL serving

### 4. Role-Based Access
- Admin role: Full access
- Moderator role: Campus-scoped access
- Custom permission classes
- Object-level permissions

### 5. Standardized Responses
- Consistent JSON format
- Error information
- Validation errors
- Proper HTTP status codes

### 6. Filtering & Search
- Article filtering by status, category, campus
- Full-text search
- Ordering support
- Pagination

## Technology Stack Details

### Django 5+
- Modern web framework
- Built-in ORM
- Authentication system
- Admin interface

### Django REST Framework
- REST API development
- ViewSets and Routers
- Serializers
- Permission classes
- Throttling
- Pagination

### SimpleJWT
- JWT token generation
- Token refresh mechanism
- Claims validation
- Sliding token support

### PostgreSQL
- Relational database
- JSONB support
- Full-text search
- Transaction support

### Pillow
- Image processing
- Format validation
- Image storage

### django-environ
- Environment variable management
- Configuration management
- .env file support

### django-cors-headers
- CORS support
- Cross-origin requests
- Origin whitelist

### django-filter
- Advanced filtering
- SearchFilter
- OrderingFilter

## Scalability Considerations

### 1. Database
- Use PostgreSQL connection pooling
- Add database indexes for common queries
- Consider read replicas for large datasets

### 2. Caching
- Add Redis for session caching
- Cache frequently accessed data
- Implement cache invalidation

### 3. File Storage
- Use cloud storage (S3, GCS) for production
- Implement CDN for media files
- Add file compression

### 4. API Performance
- Add query optimization
- Implement pagination
- Use select_related/prefetch_related

### 5. Async Tasks
- Use Celery for email sending
- Implement task queues
- Add background job processing

## Security Measures

### 1. Authentication
- JWT token-based
- Password hashing
- Token expiration

### 2. Authorization
- Role-based access control
- Object-level permissions
- Campus-scoped isolation

### 3. Data Protection
- HTTPS in production
- Secure headers
- CORS restrictions

### 4. Input Validation
- Request serialization
- File upload validation
- SQL injection prevention

### 5. Rate Limiting
- Throttling per user
- Rate limiting per IP
- DDoS protection

## Monitoring & Logging

### 1. Application Logs
- Request logging
- Error tracking
- User activity

### 2. Performance Monitoring
- Response time tracking
- Database query monitoring
- Error rate tracking

### 3. Security Logging
- Failed login attempts
- Permission violations
- API key usage

## Deployment Architecture

### Development
```
Django Dev Server
├─ SQLite (local)
└─ Console Email
```

### Staging
```
Gunicorn
├─ PostgreSQL
├─ SMTP Email
├─ Static files
└─ Media files
```

### Production
```
Nginx
├─ Gunicorn (multiple workers)
├─ PostgreSQL (replicated)
├─ Redis (cache)
├─ S3 (media storage)
├─ CloudFront (CDN)
├─ SSL/TLS
└─ Monitoring
```

## Future Enhancements

1. **Notifications**: Real-time notifications for article updates
2. **Comments**: Article comments and discussions
3. **Scheduling**: Schedule article publishing
4. **Analytics**: View statistics and engagement metrics
5. **Moderation**: Advanced moderation features
6. **API Versioning**: Multiple API versions support
7. **Webhooks**: External service integration
8. **Audit Logging**: Comprehensive audit trails

## Code Quality Standards

- Follow PEP 8 style guide
- Use type hints where applicable
- Write docstrings for all modules
- Implement comprehensive testing
- Regular code reviews
- Security scanning
- Dependency updates

---

This architecture provides a solid foundation for a scalable, maintainable, and secure Django REST Framework backend.
