# TaskForge — Task Management System

> Built by **Ayush Yadav** · Flask · MySQL · Vanilla JS

[![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![MySQL](https://img.shields.io/badge/MySQL-8%2B-4479A1?logo=mysql&logoColor=white)](https://mysql.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

TaskForge is a full-featured, role-based task management web application. Admins create tasks and assign them to employees, managers oversee their teams, and employees track and update their own work — all inside a polished UI with **drag-and-drop kanban boards**, **3D-tilt cards**, **confetti celebrations**, and real-time **skeleton loaders**.

**Live demo → [https://taskforge-production.up.railway.app](https://taskforge-production.up.railway.app)**

---

## Features

### Role-Based Access (Admin / Manager / Employee)

| Capability | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| Create / delete tasks | ✓ | ✓ | |
| Assign tasks to employees | ✓ | ✓ | |
| Manage departments | ✓ | | |
| Create manager / admin accounts | ✓ | | |
| Create employee accounts | ✓ | ✓ | |
| Self-register (always as employee) | ✓ | ✓ | ✓ |
| Update own task status & progress | ✓ | ✓ | ✓ |
| View full activity audit log | ✓ | | |

### UI & Animations

- **Drag-and-drop Kanban** — drag cards between status columns; status update hits MySQL in real time
- **Confetti burst** — Web Animations API particle explosion fires every time a task reaches Completed
- **3D tilt + spotlight** — stat and task cards tilt toward the cursor with a following light gradient using CSS custom properties
- **Liquid nav indicator** — sidebar active-state marker slides smoothly between items via `translateY()`
- **Skeleton loaders** — shimmer placeholders appear instantly before data arrives
- **Hero parallax** — login/signup SVG illustrations tilt with mouse movement
- **Custom confirm dialogs** — branded modal replaces all native `window.confirm()` calls
- **Animated counters** — stat values count up from 0 on load (bypasses `requestAnimationFrame` in hidden tabs)
- **SVG progress ring** — animated arc shows average task completion percentage
- **Dark / light theme** — persisted in `localStorage`, toggleable from the nav bar
- **Ripple buttons** — Material-style ink ripple on every click
- **3-stage responsive layout** — full sidebar (>1080 px) → icon rail (820–1080 px) → mobile drawer (<820 px)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10, Flask 3.0, Flask-SQLAlchemy 3.1 |
| Database | MySQL 8+ (PyMySQL driver) |
| Auth | Werkzeug `scrypt` hashing, Flask signed session cookies |
| Frontend | Vanilla JS ES2022, HTML5 Drag & Drop API, Web Animations API |
| Styles | CSS custom properties, Grid, Flexbox — zero frameworks |
| Production | Gunicorn 21 WSGI server, Railway (PaaS) |

---

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `ayush.yadav` | `Ayush@123` |
| Manager | `priya.mehta` | `Manager@123` |
| Employee | `aarav.sharma` | `Employee@123` |
| Employee | `rohan.patel` | `Employee@123` |
| Employee | `ananya.iyer` | `Employee@123` |
| Employee | `kabir.singh` | `Employee@123` |

---

## Local Setup

### Prerequisites
- Python 3.10+
- MySQL 8+ running locally

### 1. Clone

```bash
git clone https://github.com/ayushYadav1107/TaskForge.git
cd TaskForge
```

### 2. Bootstrap (Windows one-shot)

```bat
setup_project.bat
```

This creates `backend/venv`, installs all dependencies, and copies `.env.example → backend/.env`.

### 3. Configure the database

Edit `backend/.env`:

```env
SECRET_KEY=any-random-string
FLASK_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskforge
```

Create the database in MySQL:

```sql
CREATE DATABASE taskforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Initialise tables & seed demo data

```bash
cd backend
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
flask --app task_management init-db
flask --app task_management seed
```

### 5. Start

```bash
python run.py
```

Open [http://localhost:5000](http://localhost:5000) and sign in with any demo account above.

---

## Project Structure

```
TaskForge/
├── backend/
│   ├── task_management/
│   │   ├── models/          # SQLAlchemy models (User, Employee, Task, …)
│   │   ├── routes/          # Flask blueprints (auth, task, employee, …)
│   │   ├── services/        # Business logic + validation
│   │   ├── auth_decorators.py
│   │   ├── config.py        # Env-based configuration
│   │   ├── extensions.py    # db = SQLAlchemy()
│   │   ├── seed.py          # Sample data seeder
│   │   └── __init__.py      # App factory (create_app)
│   ├── requirements.txt
│   ├── run.py               # Dev entrypoint
│   └── .env.example
├── frontend/
│   ├── css/style.css        # ~1100 lines — design system, themes, animations
│   ├── js/
│   │   ├── api.js           # Shared helpers (fetch, tilt, confetti, drag-drop, …)
│   │   ├── admin.js         # Admin/manager dashboard
│   │   ├── employee.js      # Employee workspace
│   │   ├── login.js
│   │   └── signup.js
│   ├── index.html           # Login
│   ├── signup.html
│   ├── admin.html
│   └── employee.html
├── database/
│   └── schema.sql           # Full MySQL DDL (reviewable independently of the ORM)
├── start.sh                 # Production entrypoint: init-db → gunicorn
├── railway.toml             # Railway build & deploy config
├── nixpacks.toml            # Nixpacks build instructions
└── setup_project.bat        # Windows bootstrap
```

---

## Deployment (Railway)

Railway is the recommended host — it provides MySQL and Python in one click.

### Steps

1. Push this repo to GitHub (already done if you cloned it).
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → select `TaskForge`.
3. Add a **MySQL** plugin from the service dashboard (Railway auto-sets `DATABASE_URL`).
4. Add these environment variables in the service **Variables** tab:

   | Variable | Value |
   |---|---|
   | `SECRET_KEY` | any long random string |
   | `FLASK_ENV` | `production` |

5. Click **Deploy**. Railway runs `start.sh` which calls `flask init-db` (idempotent) then starts Gunicorn on the assigned `$PORT`.
6. To seed demo data, open the Railway shell and run:
   ```bash
   cd backend && flask --app task_management seed
   ```

---

## API Reference

| Method | Path | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Sign in |
| `POST` | `/api/auth/register` | — | Self-signup (employee role only) |
| `GET` | `/api/auth/me` | session | Current user info |
| `POST` | `/api/auth/logout` | session | Sign out |
| `GET` | `/api/tasks` | admin/manager | List all tasks |
| `POST` | `/api/tasks` | admin/manager | Create task |
| `PUT` | `/api/tasks/:id` | admin/manager | Edit task |
| `DELETE` | `/api/tasks/:id` | admin/manager | Soft-delete task |
| `GET` | `/api/employees` | admin/manager | List employees |
| `POST` | `/api/employees` | admin/manager | Create employee (+optional user) |
| `GET` | `/api/assignments/employee/:id` | session | Employee's assignments |
| `POST` | `/api/assignments` | admin/manager | Assign task to employee |
| `PUT` | `/api/assignments/:id/status` | session | Update status / progress |
| `DELETE` | `/api/assignments/:id` | admin/manager | Unassign |
| `GET` | `/api/dashboard/stats` | session | Aggregate stats |
| `GET` | `/api/activity` | admin | Activity audit log |
| `GET` | `/api/departments` | session | Department list |

---

## Security

- Passwords hashed with Werkzeug `scrypt` — never stored in plain text
- `SESSION_COOKIE_HTTPONLY=True`; `SESSION_COOKIE_SECURE=True` when `FLASK_ENV=production`
- Manager/admin account creation enforced at **both** the JS layer (hidden UI) and server layer (returns `403` for unauthorised role requests)
- Self-signup always produces `role=employee` regardless of the posted payload
- `backend/.env` is gitignored — credentials are never committed

---

## Data Model

| Table | Purpose |
|---|---|
| `users` | Login accounts with role (`admin` / `manager` / `employee`) |
| `departments` | Org department master list |
| `employees` | HR profile, linked 1:1 to a user account |
| `tasks` | Task definitions (title, priority, estimated hours, notes) |
| `task_assignments` | Junction: which employee does which task, status, completion % |
| `activity_logs` | Audit trail — before/after JSON snapshots |

---

## License

MIT © 2025 [Ayush Yadav](https://github.com/ayushYadav1107)
