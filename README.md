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

### Roles and permissions

Seven roles, defined once in `backend/task_management/permissions.py`. Routes
check permissions (`tasks.manage`, `people.manage`, …), never role names, and
`/api/auth/me` sends each user their own permission list for the UI.

| Capability | Super admin | Admin | HR | Manager | Team lead | Employee | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Admin console (separate sign-in) | ✓ | ✓ | | | | | |
| Create / edit tasks | ✓ | ✓ | | ✓ | ✓ | | |
| Delete tasks | ✓ | ✓ | | ✓ | | | |
| Assign / unassign work | ✓ | ✓ | | dept | dept | | |
| See everyone's assignments | ✓ | ✓ | | dept | dept | | read |
| Browse people | ✓ | ✓ | ✓ | dept | dept | | read |
| Add, edit, deactivate, re-role people | ✓ | ✓ | ✓ | dept | | | |
| Create departments | ✓ | ✓ | ✓ | | | | |
| Read the audit log | ✓ | ✓ | | | | | ✓ |
| Update **own** assignment status | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Rules that apply on top of the table:

* **No escalation.** Roles are ranked (super admin 6 → employee 1; auditor sits
  with HR at 4). You can only grant roles, and only touch accounts, ranked
  strictly below your own.
* **Department scope.** "dept" means the manager or team lead only sees and
  acts on people in their own department.
* **Two doors.** Super admins and admins sign in only at `/admin/login`
  (`POST /api/auth/admin/login`); everyone else only at `/login`. An admin
  session ends after `ADMIN_IDLE_MINUTES` (30) idle, and a user promoted to
  admin mid-session must sign in again through the console.

---|:---:|:---:|:---:|
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

| Role | Username | Password | Door |
|---|---|---|---|
| Super admin | `ayush.yadav` | `Ayush@123` | `/admin/login` |
| Admin | `meera.nair` | `Admin@123` | `/admin/login` |
| HR | `neha.kapoor` | `Hr@12345` | `/login` |
| Manager (Engineering) | `priya.mehta` | `Manager@123` | `/login` |
| Team lead (Engineering) | `vikram.rao` | `Lead@1234` | `/login` |
| Auditor | `isha.menon` | `Audit@123` | `/login` |
| Employee | `aarav.sharma` | `Employee@123` | `/login` |

To show these on the sign-in page, build with `VITE_DEMO_MODE=true`. A real
deploy mints a random admin password on first boot instead.

### Using MySQL or Postgres instead

Set one variable in `backend/.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/taskforge
DATABASE_URL=mysql://root:password@localhost:3306/taskforge
```

For a local Postgres, `docker compose up -d db` starts one (see
`docker-compose.yml`) at
`postgresql://taskforge:taskforge@localhost:5432/taskforge`. Hosted URLs from
Neon, Supabase, Railway or Render can be pasted as-is. Migrations run on boot.

`backend/../database/schema.sql` holds the original hand-written MySQL schema;
Alembic is the source of truth now.

---

## Tests

96 tests, no database server and no browser required.

```bash
cd backend && pytest -q          # 69 — auth, RBAC, CSRF, deploy config
cd web && npm run test           # 27 — API client, session query, formatting
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

## Interface

The UI is built on a small design-token layer (`web/src/styles/tokens.css`)
rather than ad-hoc values, so light and dark themes, spacing and type all come
from one place.

- **Neutral-first palette.** The interface is greys and 1px borders; the accent
  appears only on focus rings, the active nav row and primary buttons. Status
  is carried by a 6px coloured dot rather than a saturated pill, so a column of
  them stays scannable.
- **A real type scale** with tabular numerals, so figures line up column to
  column and each screen has one focal point instead of ten competing ones.
- **Borders over shadows.** Elevation is reserved for things that genuinely
  float — dialogs, the palette, toasts.
- **Command palette** at <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>K</kbd>, with
  subsequence matching, and `g`-then-key navigation chords (`g` `t` for Tasks).
- **Lucide** icon set, self-hosted **Inter** — the font ships with the bundle,
  so the strict CSP needs no `font-src` exception and there is no third-party
  request on first paint.
- Focus-trapped dialogs, a skip link, `aria-live` toasts, sortable table
  headers as real buttons, and `prefers-reduced-motion` honoured throughout.

---

## API

All routes are under `/api`. Mutations require the `X-CSRF-Token` header.

| Method | Route | Access |
|---|---|---|
| `POST` | `/auth/register` · `/auth/login` · `/auth/admin/login` | public |
| `GET` | `/auth/departments` | public (the signup picker needs it) |
| `GET` | `/auth/me` | authenticated |
| `POST` | `/auth/logout` · `/auth/change-password` | authenticated |
| `GET` | `/tasks` (filter, search, paginate) | authenticated |
| `POST` `PUT` | `/tasks` · `/tasks/<id>` | `tasks.manage` |
| `DELETE` | `/tasks/<id>` | `tasks.delete` |
| `GET` | `/assignments` · `/assignments/task/<id>` | `assignments.view_all` (dept-scoped for managers/leads) |
| `GET` | `/assignments/mine` | authenticated |
| `POST` `DELETE` | `/assignments` · `/assignments/<id>` | `assignments.manage`, in scope |
| `PUT` | `/assignments/<id>/status` | owner, or `assignments.manage` in scope |
| `GET` | `/employees` · `/employees/<id>` | `people.view` (dept-scoped), or yourself |
| `POST` `PUT` `DELETE` | `/employees` · `/employees/<id>` | `people.manage`, rank + scope rules |
| `PUT` · `POST` | `/employees/<id>/role` · `/employees/<id>/unlock` | `people.manage`, rank + scope rules |
| `GET` | `/departments` | authenticated |
| `POST` | `/departments` | `departments.manage` |
| `GET` | `/dashboard/stats` | `dashboard.view` |
| `GET` | `/dashboard/activity` | `audit.view` |
| `GET` | `/admin/roles` | `people.view` |
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
    components/    Modal, Toast, ConfirmDialog, CommandPalette, primitives
    layout/        app shell + single source of truth for navigation
    pages/         one file per screen
    styles/        tokens.css, base.css, components.css
Dockerfile         two-stage build
render.yaml        one-click Render blueprint
```

---

Built by **Ayush Yadav** · [MIT](LICENSE)
