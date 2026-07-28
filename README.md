# TaskForge

A task and workforce management platform built by **Ayush Yadav**.

TaskForge lets an organization manage departments, employee profiles, and
tasks, then assign that work to employees and track completion in real time
from a clean, modern dashboard — with a separate lightweight workspace for
employees to see and update only what's assigned to them.

## Overview

The app ships with two experiences:

- **Admin / Manager dashboard** — animated overview stats and completion
  ring, a Kanban + table view of every task, employee & department
  management, and a full activity log.
- **Employee workspace** — a focused Kanban of just-my-tasks, with inline
  status/progress/remarks updates and a profile page.

Everything is driven by one REST API and a session-based login, so the same
backend serves both experiences based on the signed-in user's role
(`admin`, `manager`, or `employee`).

### Signing up vs. being added

New people can **self-register at `/signup`** — they pick a department, and
the system provisions their login plus an employee profile (auto-generating
an employee code like `ENG-003`). Self-signup always creates a plain
`employee` account.

Elevated access is deliberately not self-service:

| Action | Employee | Manager | Admin |
|---|:--:|:--:|:--:|
| Sign up for an employee account | ✅ | ✅ | ✅ |
| Create employee accounts | — | ✅ | ✅ |
| Create **manager / admin** accounts | — | — | ✅ |
| Manage departments | — | ✅ | ✅ |

The "Access level" selector only appears in the employee form for admins,
and the server enforces the same rule independently — a manager who forges
the request gets a `403`.

## Architecture

```
Task_Management/
├── backend/
│   ├── requirements.txt
│   ├── run.py                       # dev entrypoint: python run.py
│   ├── .env.example                 # copy to .env and fill in DB credentials
│   └── task_management/
│       ├── __init__.py              # app factory: create_app()
│       ├── config.py                # reads DB_HOST/DB_USER/... from .env
│       ├── extensions.py            # db = SQLAlchemy()
│       ├── auth_decorators.py       # @login_required / @roles_required
│       ├── seed.py                  # sample departments/users/tasks
│       ├── models/                  # SQLAlchemy ORM models, one per table
│       ├── routes/                  # Flask blueprints — one per resource
│       └── services/                # business logic + validation
├── database/
│   └── schema.sql                   # MySQL DDL — run once against a fresh DB
├── frontend/
│   ├── index.html                   # login
│   ├── signup.html                  # self-service registration
│   ├── admin.html / js/admin.js     # admin & manager dashboard
│   ├── employee.html / js/employee.js # employee workspace
│   ├── css/style.css                # design system (light + dark)
│   └── js/api.js                    # shared fetch/motion/auth-guard helpers
└── setup_project.bat                # one-shot bootstrap (venv, deps, .env)
```

Flask serves the `frontend/` folder directly as static files, so there's a
single process and a single port — no separate frontend build step or dev
server.

## Data model

| Table              | Purpose                                                         |
|---------------------|------------------------------------------------------------------|
| `users`             | Login accounts — role is `admin`, `manager`, or `employee`      |
| `departments`       | Organizational department master list                           |
| `employees`         | HR profile, linked 1:1 to a user account                        |
| `tasks`             | Task definitions (title, priority, estimated hours, notes)      |
| `task_assignments`  | Junction table: which employee is doing which task, with status/% |
| `activity_logs`     | Audit trail of who did what, and when                           |

## Getting started

**Requirements:** Python 3.10+ and a running MySQL 8 server.

```bash
# 1. Create an empty database
mysql -u root -p -e "CREATE DATABASE taskforge"

# 2. Set up the backend
cd backend
python -m venv venv
venv\Scripts\activate            # Windows — use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
copy .env.example .env           # then edit .env with your MySQL credentials

# 3. Create the tables and load sample data
set FLASK_APP=task_management     # Windows — use `export FLASK_APP=task_management` on macOS/Linux
flask init-db
flask seed

# 4. Run the app
python run.py
```

Then open **http://localhost:5000**.

`setup_project.bat` in the project root automates steps 2–3's setup (venv,
pip install, `.env` scaffolding) if you're on Windows.

Prefer raw SQL over the ORM's `flask init-db`? Run
[`database/schema.sql`](database/schema.sql) against your database directly
with `mysql -u root -p taskforge < database/schema.sql` instead.

### This machine's local MySQL

This project's MySQL server was installed with `scoop install mysql-lts`
(no admin rights needed, no Windows service — it's a set of binaries under
`~\scoop\apps\mysql-lts`). It is **not** configured to start automatically,
so after a reboot:

```bash
start_mysql.bat     # from the project root — leave the window open
```

Credentials already set up and saved to `backend/.env` (gitignored, so
they never get committed):

| User | Password | Used for |
|---|---|---|
| `root` | `TaskForgeRoot#2026` | Admin access via `mysql -u root -p`, MySQL Workbench, etc. |
| `taskforge_app` | `TaskForgeApp#2026` | What the Flask app actually connects as (least-privilege — scoped to the `taskforge` database only) |

To connect manually and poke around: `mysql -u root -p` (enter the password
above), then `USE taskforge;`.

### Demo accounts

| Role     | Username        | Password        |
|----------|-----------------|-----------------|
| Admin    | `ayush.yadav`   | `Ayush@123`     |
| Manager  | `priya.mehta`   | `Manager@123`   |
| Employee | `aarav.sharma`  | `Employee@123`  |
| Employee | `rohan.patel`   | `Employee@123`  |
| Employee | `ananya.iyer`   | `Employee@123`  |
| Employee | `kabir.singh`   | `Employee@123`  |

Re-run `flask seed` at any time — it drops and recreates every table, so
you're back to this exact sample state (a fresh `flask init-db` is not
needed after `seed`, since seed re-creates the schema itself).

## Core functionality

- **Authentication** — self-service signup, session-based login/logout,
  change password, `/me` profile endpoint. Passwords are hashed with
  Werkzeug's `scrypt`, never stored in plain text.
- **Role-based access** — `admin`/`manager` can manage employees and
  departments, but only an `admin` can grant manager or admin access; every
  authenticated user can view and act on tasks and assignments.
- **Tasks** — create, read, update, delete, and filter by priority, creator,
  or assignment status.
- **Employees & departments** — CRUD for employee profiles (optionally
  provisioning their login in the same step), department master list.
- **Assignments** — assign a task to an employee, update status
  (`Pending` → `In Progress` → `Completed`/`On Hold`/`Cancelled`) and
  completion percentage, add remarks, or unassign.
- **Activity log** — every create/update/delete is recorded with a
  before/after snapshot for auditing.
- **Dashboard stats** — live counts, an animated completion ring, and a
  status breakdown for the overview page.

## Interface

The UI is hand-built with no CSS framework:

- **Motion** — count-up statistics, an animating SVG progress ring,
  staggered card entrances, hover lift, ripple feedback on buttons, drifting
  gradient backdrops, and animated SVG hero illustrations on the auth pages.
  All of it collapses gracefully under `prefers-reduced-motion`, and values
  render instantly rather than sitting at zero when a tab is in the
  background.
- **Responsive** — a three-stage layout: full sidebar on desktop, an icon
  rail on laptops, and a slide-in drawer with a scrim on tablets and phones.
  Data tables reflow into stacked cards below 860px, the Kanban scroll-snaps
  horizontally, and modals become bottom sheets on small screens.
- **Theming** — light and dark palettes driven entirely by CSS custom
  properties, with the choice persisted to `localStorage`.
- **Generated imagery** — inline SVG illustrations for the hero and empty
  states, plus deterministic gradient avatars derived from each person's
  name. No external image or font requests, so it works fully offline.

## Security notes

- Passwords hashed with Werkzeug's `scrypt`, never persisted in plain text.
- Sessions are signed, `httpOnly` cookies; set `FLASK_ENV=production` to also
  mark them `secure` (requires HTTPS).
- All mutating endpoints require an authenticated session; employee and
  department writes additionally require the `admin` or `manager` role, and
  only an `admin` can grant `manager`/`admin` access.

---

Built by **Ayush Yadav** as a task management project — inspired by the
core feature set of [Lakshya-Sahu47/Task-Management](https://github.com/Lakshya-Sahu47/Task-Management),
reimagined with a new UI on the same Flask + MySQL + vanilla JS foundation.
