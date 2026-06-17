# Quick Start Guide

## Setup (5 minutes)

### 1. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env - at minimum change SECRET_KEY and database config
```

### 4. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Seed Admin User
```bash
python manage.py seed_admin
```

This creates:
- Admin user: `admin@test.com` / `Admin@123456`
- Sample campuses: Chennai, Bangalore, Mumbai, Delhi, Pune

### 6. Run Server
```bash
python manage.py runserver
```

Visit `http://localhost:8000`

---

## First Steps

### Step 1: Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access": "eyJ0eXAiOi...",
    "refresh": "eyJ0eXAiOi...",
    "user": {
      "id": "...",
      "email": "admin@test.com",
      "role": "ADMIN"
    }
  }
}
```

### Step 2: Save Access Token
```bash
export TOKEN="eyJ0eXAiOi..."
```

### Step 3: Get Your Profile
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: View Campuses
```bash
curl -X GET http://localhost:8000/api/auth/campus/ \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Create Article (as Admin)
```bash
curl -X POST http://localhost:8000/api/articles/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=My First Article" \
  -F "body=This is my first article with enough content" \
  -F "category=NEWS" \
  -F "status=PUBLISHED"
```

---

## Admin Tasks

### Invite a Moderator
```bash
curl -X POST http://localhost:8000/api/admin/invite/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "moderator@test.com",
    "campus_id": "CAMPUS_UUID_HERE"
  }'
```

**Note:** Replace `CAMPUS_UUID_HERE` with a campus ID from the campuses list.

The system will send an email with a magic link. In development, check the console output.

### List Moderators
```bash
curl -X GET http://localhost:8000/api/admin/list-moderators/ \
  -H "Authorization: Bearer $TOKEN"
```

### List Invites
```bash
curl -X GET http://localhost:8000/api/admin/list-invites/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## Moderator Tasks (Simulate)

Since email is not configured locally, you'll need to:

1. Check the Django console for the invite email with the token
2. Extract the token from the magic link
3. Call onboard endpoint

### Extract Token
When you send an invite, Django console will show:
```
Subject: Welcome to NIAT Insider - Chennai Moderator Invite
To: moderator@test.com
...
[Copy the token from the link]
```

### Onboard with Token
```bash
curl -X POST http://localhost:8000/api/auth/onboard/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "password": "ModeratorPass@123",
    "confirm_password": "ModeratorPass@123"
  }'
```

### Login as Moderator
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "moderator@test.com",
    "password": "ModeratorPass@123"
  }'
```

---

## Article Management

### List Articles
```bash
curl -X GET http://localhost:8000/api/articles/ \
  -H "Authorization: Bearer $TOKEN"
```

### Filter Articles
```bash
# By status
curl -X GET http://localhost:8000/api/articles/?status=PUBLISHED \
  -H "Authorization: Bearer $TOKEN"

# By category
curl -X GET http://localhost:8000/api/articles/?category=NEWS \
  -H "Authorization: Bearer $TOKEN"

# Search
curl -X GET http://localhost:8000/api/articles/?search=announcement \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Article
```bash
curl -X GET http://localhost:8000/api/articles/ARTICLE_UUID/ \
  -H "Authorization: Bearer $TOKEN"
```

### Update Article
```bash
curl -X PUT http://localhost:8000/api/articles/ARTICLE_UUID/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Updated Title" \
  -F "status=DRAFT"
```

### Delete Article
```bash
curl -X DELETE http://localhost:8000/api/articles/ARTICLE_UUID/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## Database Access

### Django Shell
```bash
python manage.py shell

>>> from core.models import CustomUser
>>> users = CustomUser.objects.all()
>>> for user in users:
...     print(f"{user.email} - {user.role}")
```

### Admin Panel
```
http://localhost:8000/admin/
Email: admin@test.com
Password: Admin@123456
```

---

## Email Configuration

### Development (Console Backend - Default)
Emails print to console. No SMTP setup needed.

### Gmail (SMTP)
1. Enable "App Passwords" in Gmail
2. Update `.env`:
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Other SMTP Services
Update `EMAIL_HOST`, `EMAIL_PORT`, and authentication in `.env`

---

## File Uploads

### Upload Article with Image
```bash
curl -X POST http://localhost:8000/api/articles/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Article with Image" \
  -F "body=Article content..." \
  -F "category=NEWS" \
  -F "status=PUBLISHED" \
  -F "image=@/path/to/image.jpg"
```

### Download Uploaded Image
```
http://localhost:8000/media/articles/2024/01/15/image.jpg
```

---

## Troubleshooting

### Port Already in Use
```bash
# Use different port
python manage.py runserver 8001
```

### Database Error
```bash
# Reset database
python manage.py migrate --run-syncdb
python manage.py migrate
python manage.py seed_admin
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Permission Denied on Media
```bash
# Fix permissions
python manage.py shell
>>> import os
>>> os.chmod('media', 0o755)
```

---

## Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Update `SECRET_KEY`
- [ ] Use PostgreSQL
- [ ] Configure SMTP email
- [ ] Update `ALLOWED_HOSTS`
- [ ] Update `CORS_ALLOWED_ORIGINS`
- [ ] Setup static files serving
- [ ] Setup HTTPS
- [ ] Run migrations
- [ ] Create superuser
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Setup logging

---

## Useful Commands

```bash
# Create superuser
python manage.py createsuperuser

# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset app (delete data)
python manage.py migrate app_name zero

# Load fixture data
python manage.py loaddata fixture_name

# Create seed data
python manage.py seed_admin

# Access database shell
python manage.py dbshell

# Django admin shell
python manage.py shell

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic
```

---

## API Testing Tools

### Postman
1. Import `NIAT_Insider_API.postman_collection.json`
2. Set environment variables
3. Test endpoints

### VS Code REST Client
Install extension and create `.http` file:
```http
### Login
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Admin@123456"
}

### Get Profile
GET http://localhost:8000/api/auth/me/
Authorization: Bearer {{$responseBody.data.access}}
```

### Thunder Client
Similar to REST Client, available in VS Code.

---

## Next Steps

1. **Setup Frontend**: Connect React app to this API
2. **Configure Email**: Setup SMTP for actual email sending
3. **Database**: Switch to PostgreSQL for production
4. **Logging**: Setup proper logging system
5. **Monitoring**: Add error tracking and monitoring
6. **Testing**: Write comprehensive unit tests
7. **Documentation**: Generate API documentation with Swagger

---

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [JWT Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)
- [PostgreSQL Setup](https://www.postgresql.org/docs/)

---

## Support

For issues, check:
1. Console logs
2. Django admin panel
3. API_DOCUMENTATION.md
4. README.md

Happy coding! 🚀
