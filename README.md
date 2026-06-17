# NIAT Insider Moderator Platform

A full-stack Moderator Management Platform built as part of the **NIAT Full Stack Assignment**.

The application enables administrators to invite campus moderators through secure magic links, allows moderators to onboard themselves, and provides role-based article management with campus-level access control.

---

# Tech Stack

## Backend

* Python 3.x
* Django
* Django REST Framework (DRF)
* JWT Authentication
* SQLite
* Pillow (Image Upload)

## Frontend

* React
* Vite
* React Router DOM
* Axios
* React Hook Form
* React Toastify

---

# Project Structure

```
NIAT-INSIDER-MODERATOR-PLATFORM
│
├── Backend_S/
│   ├── campus/
│   ├── core/
│   ├── moderator/
│   ├── utils/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
└── README.md
```

---

# Features

## Authentication

* JWT Authentication
* Secure Login
* Protected Routes
* Role-based Authorization

## Admin

* Login
* Invite Campus Moderators
* Magic Link Generation
* Campus Assignment
* View All Articles
* View Moderators Dashboard

## Moderator

* Secure Onboarding
* Dashboard
* Campus Scoped Articles
* Create Articles
* Edit Own Articles
* Delete Own Articles
* Image Upload Support

## Article Management

* Create
* Read
* Update
* Delete
* Search
* Category Filter
* Status Filter
* Campus Guard

---

# Security Features

* JWT Authentication
* Role Based Access Control
* Campus Scoped Authorization
* Magic Link Onboarding
* Protected APIs
* Backend Validation
* Image Validation
* Input Validation

---

# API Modules

### Authentication

```
POST /api/auth/login/
POST /api/auth/onboard/
```

### Admin

```
POST /api/admin/invite/
GET  /api/admin/invitations/
```

### Articles

```
GET    /api/articles/
GET    /api/articles/{id}/
POST   /api/articles/
PUT    /api/articles/{id}/
DELETE /api/articles/{id}/
```

---

# Validation

The application performs validation on both frontend and backend.

### Login

* Email required
* Password required

### Onboarding

* Password confirmation
* Secure token validation

### Article

Title

* Required

Body

* Minimum 10 characters

Category

* Required

Status

* Required

Image

* Optional
* JPG / JPEG / PNG
* Maximum size validation

---

# Roles

## Administrator

Can

* Invite Moderators
* Assign Campus
* View All Articles
* Manage Moderators

---

## Moderator

Can

* Login
* Complete Onboarding
* Create Articles
* Edit Own Articles
* Delete Own Articles
* View Campus Articles Only

Cannot

* Access Other Campuses
* Modify Other Moderators' Articles

---

# Installation

## Backend

```bash
cd Backend_S

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

Backend runs on

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# Environment Variables

## Backend

Create

```
Backend_S/.env
```

Example

```
SECRET_KEY=your-secret-key

DEBUG=True

EMAIL_HOST=smtp.gmail.com

EMAIL_PORT=587

EMAIL_HOST_USER=your-email

EMAIL_HOST_PASSWORD=your-password
```

---

## Frontend

Create

```
frontend/.env
```

Example

```
VITE_API_URL=http://127.0.0.1:8000/api
```

---

# Git Workflow

The project follows the required branching strategy.

```
main

feature/project-setup

feature/auth-backend

feature/invite-magic-link

feature/article-api

feature/moderator-ui

feature/integration
```

Commit messages follow Conventional Commits.

Examples

```
feat: add moderator login endpoint

feat: implement article CRUD API

fix: resolve article validation issue

chore: configure Django project structure

docs: update project README
```

---

# Screenshots

* Admin Dashboard
* Moderator Dashboard
* Invite Moderator
* Article Management
* Login
* Onboarding

(Add screenshots here before submission if required.)

---

# Future Improvements

* Pagination
* Rich Text Editor
* Email Templates
* Notifications
* Dark Mode
* Analytics Dashboard
* Unit Tests
* Docker Deployment

---

# Author

**Mahesh Kontham**

B.Tech Computer Science Engineering

Keshav Memorial Institute of Technology

GitHub

https://github.com/Mahesh-Kontham

---

# Assignment

NIAT Full Stack Developer Assignment

Built using Django REST Framework and React following role-based architecture, secure authentication, and campus-scoped authorization.
