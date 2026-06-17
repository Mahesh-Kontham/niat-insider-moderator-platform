# NIAT Insider API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

All endpoints (except login and onboard) require JWT authentication. Include the token in the request header:

```
Authorization: Bearer {access_token}
```

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Error message",
  "errors": { /* validation errors if any */ }
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request data or validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but not authorized for this resource
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### POST /auth/login
Login with email and password to get JWT tokens.

**Request:**
```json
{
  "email": "admin@test.com",
  "password": "Admin@123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@test.com",
      "role": "ADMIN",
      "campus": null
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

---

### GET /auth/me
Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@test.com",
    "role": "ADMIN",
    "campus": null,
    "campus_name": null,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### POST /auth/change-password
Change the current user's password.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request:**
```json
{
  "old_password": "Admin@123456",
  "new_password": "NewPassword@123456",
  "confirm_password": "NewPassword@123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Errors:**
- `400` - Passwords don't match or old password is incorrect

---

### POST /auth/onboard
Complete moderator onboarding with magic link token.

**Request:**
```json
{
  "token": "signed-token-from-email",
  "password": "NewModerator@123",
  "confirm_password": "NewModerator@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": null
}
```

**Errors:**
- `400` - Invalid token, expired token, or passwords don't match

---

## Admin Endpoints

All admin endpoints require `role=ADMIN`.

### POST /admin/invite
Send moderator invitation via email.

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request:**
```json
{
  "email": "moderator@test.com",
  "campus_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Invite sent successfully",
  "data": null
}
```

**Errors:**
- `400` - Email already registered, invalid campus
- `403` - Only admins can send invites

---

### GET /admin/list-moderators
List all moderators in the system.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "email": "moderator@test.com",
      "role": "MODERATOR",
      "campus": "550e8400-e29b-41d4-a716-446655440001",
      "campus_name": "Chennai",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /admin/list-invites
List all pending (unused) invitations.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "email": "new-moderator@test.com",
      "campus": "550e8400-e29b-41d4-a716-446655440001",
      "campus_name": "Chennai",
      "expires_at": "2024-01-16T10:30:00Z",
      "is_used": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### DELETE /admin/revoke-invite/{invite_id}
Revoke a pending invitation.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Invite revoked successfully",
  "data": null
}
```

**Errors:**
- `400` - Invite already used
- `404` - Invite not found

---

## Article Endpoints

### GET /articles/
List articles with optional filtering and search.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `category` - Filter by category (NEWS, EVENT, ANNOUNCEMENT, FEATURE, OTHER)
- `status` - Filter by status (DRAFT, PUBLISHED)
- `search` - Search in title and body
- `ordering` - Sort field (e.g., -created_at, title)
- `page` - Page number (default: 1)

**Examples:**
```
GET /articles/?status=PUBLISHED
GET /articles/?category=NEWS&search=announcement
GET /articles/?ordering=-created_at&page=2
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
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

**Access Control:**
- **Admin**: Sees all articles
- **Moderator**: Sees only articles from their campus

---

### POST /articles/
Create a new article.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (string, required) - Article title (min 3 chars)
- `body` (text, required) - Article content (min 10 chars)
- `category` (select, required) - NEWS, EVENT, ANNOUNCEMENT, FEATURE, OTHER
- `status` (select, required) - DRAFT or PUBLISHED
- `image` (file, optional) - JPG, JPEG, PNG (max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "title": "Campus Event",
    "body": "Event details...",
    "category": "EVENT",
    "status": "PUBLISHED",
    "image": "/media/articles/2024/01/15/image.jpg",
    "author_name": "moderator@test.com",
    "campus_name": "Chennai",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation errors (title too short, image too large, etc.)
- `403` - User not assigned to a campus

---

### GET /articles/{article_id}/
Get a specific article.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):** Same as POST response

**Errors:**
- `404` - Article not found
- `403` - Access denied (not from user's campus)

---

### PUT /articles/{article_id}/
Update an article.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data (all optional):**
- `title`
- `body`
- `category`
- `status`
- `image`

**Response (200):**
```json
{
  "success": true,
  "message": "Article updated successfully",
  "data": { /* updated article */ }
}
```

**Errors:**
- `400` - Validation error
- `403` - Only article author or admin can edit
- `404` - Article not found

---

### DELETE /articles/{article_id}/
Delete an article.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Article deleted successfully",
  "data": null
}
```

**Errors:**
- `403` - Only article author or admin can delete
- `404` - Article not found

---

### GET /articles/published/
List only published articles.

**Response:** Same as GET /articles/ but filtered to `status=PUBLISHED`

---

### GET /articles/drafts/
List only draft articles.

**Response:** Same as GET /articles/ but filtered to `status=DRAFT`

---

## Campus Endpoints

### GET /auth/campus/
List all campuses.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Chennai",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "name": "Bangalore",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /campus/with-articles/
List campuses with article count.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Chennai",
      "article_count": 15,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "name": "Bangalore",
      "article_count": 8,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Permission System

### Role-Based Access

**ADMIN:**
- Full access to all articles
- Can invite moderators
- Can view all moderators
- Can revoke invitations

**MODERATOR:**
- Can create, read, update, delete articles in their assigned campus only
- Cannot access articles from other campuses
- Cannot invite other moderators
- Cannot access admin functions

### Campus-Scoped Access

When a moderator tries to access an article from another campus:
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Access denied"
}
```

---

## Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Validation error",
  "errors": {
    "title": ["This field may not be blank."],
    "email": ["Enter a valid email address."]
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Access denied"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Not found"
}
```

---

## Rate Limiting

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour

When rate limit is exceeded:
```
429 Too Many Requests
```

---

## Pagination

List endpoints support pagination:
- Default page size: 20 items
- Query parameter: `?page=2`

Response includes pagination info in headers.

---

## Search & Filtering

### Article Search
Search across title and body:
```
GET /articles/?search=announcement
```

### Filtering
```
GET /articles/?status=PUBLISHED&category=NEWS&campus=uuid
```

### Ordering
```
GET /articles/?ordering=-created_at
GET /articles/?ordering=title
```

Available ordering fields:
- `created_at`, `-created_at`
- `updated_at`, `-updated_at`
- `title`
- `status`

---

## File Upload

### Image Upload Specifications
- **Max Size**: 5MB
- **Allowed Formats**: JPG, JPEG, PNG
- **Storage**: `/media/articles/YYYY/MM/DD/`

### Upload Example
```bash
curl -X POST http://localhost:8000/api/articles/ \
  -H "Authorization: Bearer {token}" \
  -F "title=Article Title" \
  -F "body=Article content..." \
  -F "category=NEWS" \
  -F "status=PUBLISHED" \
  -F "image=@/path/to/image.jpg"
```

---

## Token Management

### Access Token
- **Lifetime**: 15 minutes (default)
- **Usage**: Include in `Authorization: Bearer {token}` header

### Refresh Token
- **Lifetime**: 7 days (default)
- **Usage**: Use to get a new access token when it expires

### Refreshing Token
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "{refresh_token}"}'
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123456"}'
```

### Create Article
```bash
curl -X POST http://localhost:8000/api/articles/ \
  -H "Authorization: Bearer {access_token}" \
  -F "title=Test Article" \
  -F "body=Test content with more than 10 characters" \
  -F "category=NEWS" \
  -F "status=PUBLISHED"
```

### List Articles
```bash
curl -X GET http://localhost:8000/api/articles/ \
  -H "Authorization: Bearer {access_token}"
```

---

## Postman Collection

Import the `NIAT_Insider_API.postman_collection.json` file into Postman to test all endpoints with pre-configured requests.

**Setup:**
1. Open Postman
2. Click "Import"
3. Select the JSON file
4. Set `access_token` and `admin_access_token` variables in Postman environment

---

## Support

For API issues or questions, refer to the main README.md or contact the development team.
