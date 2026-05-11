# ⚡ Smart Task Management System

A task management web app I built using Flask and PostgreSQL, with real-time updates via WebSockets and basic analytics using Pandas and NumPy.

## What it does

- Register and log in to your own account
- Add, edit, delete and filter tasks
- Each task has a title, description, priority (low/medium/high) and status (pending/in progress/completed)
- Dashboard shows live analytics — completion rate, priority breakdown
- Real-time notifications when tasks are added, updated or deleted (no page refresh needed)

## Tech Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Backend   | Python, Flask               |
| Database  | PostgreSQL + SQLAlchemy     |
| Auth      | Flask-Login + Flask-Bcrypt  |
| Analytics | Pandas, NumPy               |
| Real-time | Flask-SocketIO (WebSockets) |
| Frontend  | HTML, CSS, Vanilla JS       |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/codewsomesh/task-manager.git
cd task-manager
```

### 2. Set up virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up PostgreSQL

```bash
psql -U postgres
CREATE DATABASE task_manager_db;
\q
```

Or use the schema file directly:

```bash
psql -U postgres -f schema.sql
```

### 5. Create a `.env` file

SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_manager_db

### 6. Run it

```bash
python app.py
```

Open **http://localhost:5000** in your browser.

## API Endpoints

| Method   | Endpoint          | Description                           |
| -------- | ----------------- | ------------------------------------- |
| `GET`    | `/api/tasks`      | Get tasks (filter by status/priority) |
| `POST`   | `/api/tasks`      | Create a task                         |
| `PUT`    | `/api/tasks/<id>` | Update a task                         |
| `DELETE` | `/api/tasks/<id>` | Delete a task                         |
| `GET`    | `/api/analytics`  | Get analytics data                    |
| `POST`   | `/auth/register`  | Register                              |
| `POST`   | `/auth/login`     | Login                                 |
| `GET`    | `/auth/logout`    | Logout                                |

## Task Structure

```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "low | medium | high",
  "status": "pending | in_progress | completed"
}
```

## Project Structure

```
task_manager/
├── app.py              # Entry point
├── config.py           # Config
├── extensions.py       # Flask extensions
├── websockets.py       # SocketIO events
├── schema.sql          # DB schema
├── requirements.txt
├── auth/               # Auth blueprint
├── api/                # REST API
├── main/               # Main routes
├── models/             # DB models
├── static/             # CSS & JS
└── templates/          # HTML templates
```
