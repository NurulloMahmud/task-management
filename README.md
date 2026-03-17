# Task Management API

A REST API for managing tasks with user authentication, built with Django REST Framework and Simple JWT.

## Tech Stack

- Python
- Django
- Django REST Framework
- Simple JWT
- PostgreSQL

## Setup

### 1. Clone and create virtual environment
#### Linux/MacOS
```bash
python3 -m venv env
source env/bin/activate
```

#### Windows
```bash
python -m venv env
env\Scripts\activate
```
### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```
SECRET_KEY=67ad5b08195417cff1a35f9d5eee21a7638b2ceb237cefbb784ae689949e6ac6
DEBUG=False
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
DB_HOST=localhost
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Start the server

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`.

---

## API Documentation

Base URL: `/api/`

All endpoints except Register and Login require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

### Authentication

#### Register

Creates a new user account and returns JWT tokens.

```
POST /api/register
```

**Request body:**

| Field            | Type   | Required | Description              |
|------------------|--------|----------|--------------------------|
| username         | string | yes      | Unique username          |
| email            | string | yes      | Email address            |
| password         | string | yes      | Minimum 8 characters     |
| password_confirm | string | yes      | Must match password      |

**Example request:**

```json
{
    "username": "john",
    "email": "john@example.com",
    "password": "securepass123",
    "password_confirm": "securepass123"
}
```

**Response `201 Created`:**

```json
{
    "user": {
        "username": "john",
        "email": "john@example.com"
    },
    "tokens": {
        "refresh": "eyJhbGciOi...",
        "access": "eyJhbGciOi..."
    }
}
```

**Error `400 Bad Request`:**

```json
{
    "password_confirm": ["Passwords don't match."]
}
```

---

#### Login

Returns a JWT token pair for an existing user.

```
POST /api/login
```

**Request body:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| username | string | yes      | Username    |
| password | string | yes      | Password    |

**Example request:**

```json
{
    "username": "john",
    "password": "securepass123"
}
```

**Response `200 OK`:**

```json
{
    "refresh": "eyJhbGciOi...",
    "access": "eyJhbGciOi..."
}
```

**Error `401 Unauthorized`:**

```json
{
    "detail": "No active account found with the given credentials"
}
```

---

### Tasks

All task endpoints require authentication. Users can only access their own tasks.

#### List Tasks

Returns all tasks belonging to the authenticated user.

```
GET /api/tasks
```

**Response `200 OK`:**

```json
[
    {
        "id": 1,
        "title": "Fix login bug",
        "description": "Null pointer in auth flow",
        "status": "in_progress",
        "owner": {
            "id": 1,
            "username": "john"
        }
    },
    {
        "id": 2,
        "title": "Write tests",
        "description": null,
        "status": "todo",
        "owner": {
            "id": 1,
            "username": "john"
        }
    }
]
```

---

#### Create Task

Creates a new task owned by the authenticated user.

```
POST /api/tasks
```

**Request body:**

| Field       | Type   | Required | Description                              |
|-------------|--------|----------|------------------------------------------|
| title       | string | yes      | Task title, max 255 characters           |
| description | string | no       | Task description                         |
| status      | string | no       | One of: `todo`, `in_progress`, `done`. Defaults to `todo` |

**Example request:**

```json
{
    "title": "Deploy to production",
    "description": "Set up nginx and systemd",
    "status": "todo"
}
```

**Response `201 Created`:**

```json
{
    "id": 3,
    "title": "Deploy to production",
    "description": "Set up nginx and systemd",
    "status": "todo",
    "owner": {
        "id": 1,
        "username": "john"
    }
}
```

**Error `400 Bad Request`:**

```json
{
    "status": ["\"invalid\" is not a valid choice."]
}
```

---

#### Update Task

Fully updates an existing task. The task must belong to the authenticated user.

```
PUT /api/tasks/<id>
```

**Request body:**

| Field       | Type   | Required | Description                              |
|-------------|--------|----------|------------------------------------------|
| title       | string | yes      | Task title, max 255 characters           |
| description | string | no       | Task description                         |
| status      | string | yes      | One of: `todo`, `in_progress`, `done`    |

**Example request:**

```
PUT /api/tasks/3
```

```json
{
    "title": "Deploy to production",
    "description": "Set up nginx, systemd, and SSL",
    "status": "in_progress"
}
```

**Response `200 OK`:**

```json
{
    "id": 3,
    "title": "Deploy to production",
    "description": "Set up nginx, systemd, and SSL",
    "status": "in_progress",
    "owner": {
        "id": 1,
        "username": "john"
    }
}
```

**Error `404 Not Found`:**

```json
{
    "detail": "Not found."
}
```

---

#### Delete Task

Deletes a task. The task must belong to the authenticated user.

```
DELETE /api/tasks/<id>
```

**Example request:**

```
DELETE /api/tasks/3
```

**Response `204 No Content`:** Empty response body.

**Error `404 Not Found`:**

```json
{
    "detail": "Not found."
}
```

---

### Status Values

| Value         | Label       |
|---------------|-------------|
| `todo`        | To Do       |
| `in_progress` | In Progress |
| `done`        | Done        |

---