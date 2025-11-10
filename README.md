# SkillSync

A mobile-first gig platform connecting ALU students with short-term opportunities from local providers.

## 🎯 Overview

SkillSync is a three-sided marketplace platform that enables:

- **Students** to discover and apply for gigs matching their skills
- **Providers** to post opportunities and manage applications
- **Admins** to moderate content and ensure platform quality

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
chmod +x setup.sh
./setup.sh
```

### Run the Application

```bash
./run                           # Start backend server
```

Visit `http://localhost:5000/api/docs` for API documentation.

### Verify Everything Works

```bash
./test.sh                       # Run comprehensive checks and fast tests (~15 seconds)
```

## 🏗️ Tech Stack

### Backend

- **Framework**: Flask 3.0
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Firebase Auth
- **API Docs**: OpenAPI 3.0 (Swagger UI)
- **Testing**: pytest

### Frontend

- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: React Context API

### Infrastructure

- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in error tracking and performance monitoring

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:5000/api/docs
- **OpenAPI Spec**: http://localhost:5000/api/docs/spec.json

### Key Endpoints

| Endpoint             | Method | Description     |
| -------------------- | ------ | --------------- |
| `/api/health`        | GET    | Health check    |
| `/api/gigs`          | GET    | List all gigs   |
| `/api/gigs/{id}`     | GET    | Get gig details |
| `/api/applications`  | POST   | Apply to a gig  |
| `/api/auth/register` | POST   | Register user   |
| `/api/auth/login`    | POST   | Login user      |

## 🗄️ Database

### Schema

The database includes tables for:

- Users (students, providers, admins)
- Gigs and applications
- Ratings and reviews
- Notifications and preferences
- Skills and student profiles
- Audit logs and feedback

### Seed Data

After setup, the database contains:

- 10 sample users (6 students, 3 providers, 1 admin)
- 12 gigs across various categories
- 12 applications with different statuses
- 18 skills and mappings
- Sample ratings, notifications, and more

## 🧪 Testing

### Running Tests

```bash
./test.sh
```

### Test Coverage

The test suite includes:

- **Authentication Tests**: User registration, login, token validation
- **Gig Tests**: CRUD operations, filtering, search functionality
- **Application Tests**: Submission, status updates, provider management
- **Rating Tests**: Student/provider ratings, validation
- **Notification Tests**: Creation, delivery, preferences
- **Admin Tests**: User management, analytics, audit logs

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://tester:testpass@localhost:5432/skillsync
FIREBASE_CREDENTIALS_PATH=firebase_credentials.json
```

## Contributors

- Ajak Chol
- Angel Kibui
- Linda Sheja
- Pacifique Uwenayo Alain
- Selena Isimbi
- Sonia Bayingana Umubyeyi
