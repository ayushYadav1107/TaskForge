# TaskForge — Task & Workforce Management

> Full-stack, role-based task management. **React + TypeScript** front end, **Flask + SQLAlchemy** REST API, **PostgreSQL / MySQL / SQLite**, containerised and CI-tested.

[![CI](https://github.com/ayushYadav1107/TaskForge/actions/workflows/ci.yml/badge.svg)](https://github.com/ayushYadav1107/TaskForge/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://docker.com)

Admins and managers create work and assign it; employees track and update only
their own. Every mutation is written to an append-only audit log with full
before/after state.

---

## Architecture

```
┌─────────────────────────────┐
│  React 18 + TypeScript SPA  │   Vite · React Router · TanStack Query
│  (web/)                     │
└──────────────┬──────────────┘
               │  same-origin fetch, session cookie + CSRF header
┌──────────────▼──────────────┐
│  Flask REST API             │   routes → services → models
│  (backend/task_management/) │   no business logic in a route handler
└──────────────┬──────────────┘
               │  SQLAlchemy 2.0 ORM · Alembic migrations
┌──────────────▼──────────────┐
│  PostgreSQL / MySQL/ SQLite │
└─────────────────────────────┘
```

The SPA and the API are served from **one origin**: in production Flask serves
the compiled Vite bundle. That keeps the session cookie first-party, which
means no CORS configuration and no access token sitting in `localStorage` for
an XSS payload to steal.

**Layering.** Route handlers parse the request, call a service, and shape the
response — nothing else. All business rules live in `services/`, which is why
the same validation applies whether a task is created through the API, the
seed script, or the CLI.

---

## Security

Cookie sessions are the right fit for a same-origin SPA, but they have to be
built correctly. What that meant here:

| Concern | Approach |
|---|---|
| Password storage | `scrypt` via Werkzeug — memory-hard, so GPU cracking is expensive |
| Brute force | Lockout after 5 failures for 15 min, **counted on the user row** so the limit is shared across every worker and survives restarts |
| Username enumeration | One generic error for every credential failure, plus a dummy hash on the miss path so a nonexistent user doesn't answer faster |
| CSRF | Double-submit token: a readable cookie the SPA echoes in `X-CSRF-Token`, verified with `compare_digest`. Enforced only on authenticated mutations, so `curl`-ing the login endpoint still works |
| Session fixation | The session is cleared and rebuilt at the login boundary |
| Stale privileges | The role is re-read from the database each request, so a demotion binds immediately instead of waiting for the cookie to expire |
| XSS | Strict CSP (`script-src 'self'`, no `unsafe-inline`) and React's escaping by default |
| Transport | `Secure` + `HttpOnly` + `SameSite=Lax` cookies and HSTS in production |
| Secrets | Production **refuses to boot** without `SECRET_KEY` rather than falling back to a shared default |
| Error leakage | Unhandled exceptions return a generic message; the traceback goes to the log with a correlation id |

Authorization is enforced **server-side on every endpoint**. The React route
guards exist for UX only — anything decided in the browser can be edited in the
browser, so `backend/tests/test_authorization.py` asserts the real rules.

### Permission matrix

| Capability | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| Create / edit / delete tasks | ✓ | ✓ | |
| Assign work, remove assignments | ✓ | ✓ | |
| View all assignments & staff directory | ✓ | ✓ | |
| Manage departments | ✓ | ✓ | |
| Create manager / admin accounts | ✓ | | |
| Read the audit log | ✓ | | |
| Update **own** assignment status | ✓ | ✓ | ✓ |
| View own profile | ✓ | ✓ | ✓ |
| Self-register (always as employee) | ✓ | ✓ | ✓ |

---

## Running it locally

**Requirements:** Python 3.11+, Node 20+. No database server needed — it falls
back to SQLite.

```bash
git clone https://github.com/ayushYadav1107/TaskForge.git
cd TaskForge
```

**API** (terminal 1):

```bash
cd backend
python -m venv venv && venv/Scripts/activate      # macOS/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
flask --app task_management seed                  # demo data + logins
python run.py                                     # http://localhost:5000
```

**Front end** (terminal 2):

```bash
cd web
npm install
npm run dev                                       # http://localhost:5173
```

Vite proxies `/api` to port 5000, so the cookie stays first-party in dev
exactly as it is in production.

### Demo logins

Created by `flask seed`:

| Role | Username | Password |
|---|---|---|
| Admin | `ayush.yadav` | `Ayush@123` |
| Manager | `priya.mehta` | `Manager@123` |
| Employee | `aarav.sharma` | `Employee@123` |

To show these on the sign-in page, build with `VITE_DEMO_MODE=true`. A real
deploy mints a random admin password on first boot instead.

### Using MySQL or Postgres instead

Set one variable in `backend/.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/taskforge
DATABASE_URL=mysql://root:password@localhost:3306/taskforge
```

`backend/../database/schema.sql` holds the original hand-written MySQL schema;
Alembic is the source of truth now.

---

## Tests

92 tests, no database server and no browser required.

```bash
cd backend && pytest -q          # 69 — auth, RBAC, CSRF, deploy config
cd web && npm run test           # 23 — API client, formatting
```

The backend suite runs on in-memory SQLite with a fresh schema per test. The
most load-bearing file is `test_authorization.py`: it pins every rule in the
matrix above, including the ones that were originally wrong.

`test_config.py` is worth a look too — it pins the database-URL normalisation
that decides whether a deploy boots at all. Managed hosts hand out
`postgres://`, which SQLAlchemy 2 rejects outright, and that failure cannot be
reproduced locally against SQLite.

---

## Deployment

The `Dockerfile` is a two-stage build: Node compiles the SPA, then a slim
Python image takes only the built assets, runs as a non-root user, and serves
both through Gunicorn. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for Render,
Railway, Fly.io and plain-Docker instructions.

```bash
docker build -t taskforge .
docker run -p 8000:8000 \
  -e SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')" \
  -e APP_ENV=production \
  -e DATABASE_URL="postgresql://…" \
  taskforge
```

On first boot against an empty database the app applies migrations, creates the
default departments, and mints an admin account — so a fresh deploy is usable
immediately instead of presenting a signup form with an empty department list.

`/api/healthz` is a pure liveness check; `/api/readyz` round-trips a query and
returns 503 when the database is unreachable.

---

## API

All routes are under `/api`. Mutations require the `X-CSRF-Token` header.

| Method | Route | Access |
|---|---|---|
| `POST` | `/auth/register` · `/auth/login` | public |
| `GET` | `/auth/departments` | public (the signup picker needs it) |
| `GET` | `/auth/me` | authenticated |
| `POST` | `/auth/logout` · `/auth/change-password` | authenticated |
| `GET` | `/tasks` (filter, search, paginate) | authenticated |
| `POST` `PUT` `DELETE` | `/tasks` · `/tasks/<id>` | admin, manager |
| `GET` | `/assignments` · `/assignments/task/<id>` | admin, manager |
| `GET` | `/assignments/mine` | authenticated |
| `POST` `DELETE` | `/assignments` · `/assignments/<id>` | admin, manager |
| `PUT` | `/assignments/<id>/status` | owner, or admin/manager |
| `GET` `POST` `PUT` `DELETE` | `/employees` | admin, manager |
| `GET` | `/departments` | authenticated |
| `POST` | `/departments` | admin, manager |
| `GET` | `/dashboard/stats` | admin, manager |
| `GET` | `/dashboard/activity` | admin |
| `GET` | `/healthz` · `/readyz` | public |

---

## Engineering notes

Things worth asking me about:

- **Authorization was the real bug.** The first version guarded task and
  assignment endpoints with "is logged in" rather than "is allowed", so any
  employee could delete tasks and edit other people's progress. Fixing it meant
  separating authentication from authorization and writing the tests that prove
  the difference.
- **N+1 queries.** The task list issued one `COUNT` per task and the dashboard
  loaded every assignment row into Python to tally statuses. Both are now a
  single `GROUP BY`.
- **Naive UTC timestamps.** The API serialises `datetime.utcnow()` with no zone
  marker, so the browser read every timestamp as local time and labelled
  everything "just now". Pinned in `format.test.ts`.
- **Logout raced its own redirect.** Clearing the query cache left the auth
  query pending, so the route guard read the last known user for one render and
  bounced straight back to the dashboard. Signed-out is now modelled as data
  (`null`), not as an absent value.
- **Why not JWT?** Same-origin SPA, so a cookie is strictly better: `HttpOnly`
  means a script cannot read it, and revocation is immediate. A token in
  `localStorage` buys nothing here and is readable by any injected script.

---

## Project layout

```
backend/
  task_management/
    routes/        HTTP layer — parse, delegate, respond
    services/      business rules and validation
    models/        SQLAlchemy models
    config.py      env-driven, multi-engine
    security.py    CSRF, security headers, request ids
  migrations/      Alembic
  tests/           pytest
web/
  src/
    api/           typed client + TanStack Query hooks
    auth/          session context and route guards
    components/    Modal, Toast, ConfirmDialog, UI primitives
    pages/         one file per screen
    styles/        design system
Dockerfile         two-stage build
render.yaml        one-click Render blueprint
```

---

Built by **Ayush Yadav** · [MIT](LICENSE)
