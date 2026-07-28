# TaskForge

A task and workforce management platform built by **Ayush Yadav**.

TaskForge lets an organization manage departments, employee profiles, and
tasks, then assign that work to employees and track completion in real time
from a clean, modern dashboard — with a separate lightweight workspace for
employees to see and update only what's assigned to them.

## Overview

The app ships with two experiences:

- **Admin / Manager dashboard** — overview stats, a Kanban + table view of
  every task, employee & department management, and a full activity log.
- **Employee workspace** — a focused Kanban of just-my-tasks, with inline
  status/progress/remarks updates and a profile page.

Everything is driven by one REST API and a session-based login, so the same
backend serves both experiences based on the signed-in user's role
(`admin`, `manager`, or `employee`).

## Architecture

```
Task_Management/
├── server/
│   ├── index.js            # Express app, sessions, static file serving
│   ├── config.js
│   ├── db/
│   │   ├── schema.sql       # reference relational schema (documentation)
│   │   ├── jsonStore.js     # zero-dependency embedded JSON database
│   │   └── seed.js          # sample departments/users/tasks
│   ├── middleware/auth.js   # session auth + role guards
│   ├── services/            # business logic (auth, task, employee, assignment, activity)
│   └── routes/              # REST endpoints per resource
├── public/
│   ├── index.html            # login
│   ├── admin.html / admin.js       # admin & manager dashboard
│   ├── employee.html / employee.js # employee workspace
│   ├── css/style.css         # design system (light + dark)
│   └── js/api.js             # shared fetch/toast/auth-guard helpers
└── package.json
```

### Why no MySQL?

The reference project this was inspired by uses Flask + MySQL. This version
is a from-scratch **Node.js + Express** rebuild with a different UI and a
zero-config, zero-native-dependency data layer (`server/db/jsonStore.js`) so
it runs anywhere `node` runs — no database server to install or configure.
[`server/db/schema.sql`](server/db/schema.sql) documents the same relational
shape (tables, foreign keys, constraints) if you ever want to swap in a real
RDBMS later.

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

**Requirements:** Node.js 18+ (no database installation needed).

```bash
npm install
npm run seed    # creates data/db.json with sample departments/users/tasks
npm start
```

Then open **http://localhost:4000**.

Use `npm run dev` instead of `npm start` while developing — it restarts the
server on file changes.

### Demo accounts

| Role     | Username        | Password        |
|----------|-----------------|-----------------|
| Admin    | `ayush.yadav`   | `Ayush@123`     |
| Manager  | `priya.mehta`   | `Manager@123`   |
| Employee | `aarav.sharma`  | `Employee@123`  |
| Employee | `rohan.patel`   | `Employee@123`  |
| Employee | `ananya.iyer`   | `Employee@123`  |
| Employee | `kabir.singh`   | `Employee@123`  |

Re-run `npm run seed` at any time to reset `data/db.json` back to this
sample state.

## Core functionality

- **Authentication** — session-based login/logout, change password, `/me`
  profile endpoint. Passwords are hashed with bcrypt, never stored in plain
  text.
- **Role-based access** — `admin`/`manager` can manage employees and
  departments; every authenticated user can view and act on tasks and
  assignments (matching the reference project's permission model).
- **Tasks** — create, read, update, delete, and filter by priority, creator,
  or assignment status.
- **Employees & departments** — CRUD for employee profiles (optionally
  provisioning their login in the same step), department master list.
- **Assignments** — assign a task to an employee, update status
  (`Pending` → `In Progress` → `Completed`/`On Hold`/`Cancelled`) and
  completion percentage, add remarks, or unassign.
- **Activity log** — every create/update/delete is recorded with a
  before/after snapshot for auditing.
- **Dashboard stats** — live counts and a status breakdown for the overview
  page.

## Security notes

- Passwords hashed with bcrypt (10 salt rounds), never persisted in plain
  text.
- Sessions are signed, `httpOnly` cookies; set `NODE_ENV=production` to also
  mark them `secure` (requires HTTPS).
- All mutating endpoints require an authenticated session; employee and
  department writes additionally require the `admin` or `manager` role.

---

Built by **Ayush Yadav** as a task management project — inspired by the
core feature set of [Lakshya-Sahu47/Task-Management](https://github.com/Lakshya-Sahu47/Task-Management),
reimagined with a new stack, UI, and data layer.
