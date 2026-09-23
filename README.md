<div align="center">

<img src="docs/screenshots/login.png" alt="TaskForge sign-in" width="880">

# TaskForge

### Role-based task & workforce management, built end to end.

**React 18 + TypeScript** SPA · **Flask + SQLAlchemy 2** REST API · **PostgreSQL / MySQL / SQLite** · one Docker image

[![CI](https://github.com/ayushYadav1107/TaskForge/actions/workflows/ci.yml/badge.svg)](https://github.com/ayushYadav1107/TaskForge/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-116_passing-2ea043?logo=pytest&logoColor=white)](#-tests)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Flask](https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/license-MIT-e8572a)](LICENSE)

</div>

---

> Admins and managers create work and assign it. Employees track and update only
> their own. Managers and team leads see only their department. Auditors read
> everything and change nothing. Every mutation is written to an append-only
> audit log with full before/after state.

<br>

<table>
<tr>
<td width="33%" valign="top">

### 🔐 Seven real roles
Super admin, admin, HR, manager, team lead, employee, auditor — defined once in
a single permission map, enforced on every endpoint, never in the browser.

</td>
<td width="33%" valign="top">

### 📋 Board & list
Kanban across five statuses with drag-to-move, plus a sortable table view,
search, priority filters and pagination.

</td>
<td width="33%" valign="top">

### 🧾 Append-only audit
Every create, update, delete and role change lands in `activity_logs` with the
full JSON before/after state.

</td>
</tr>
<tr>
<td valign="top">

### ⌨️ Command palette
<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd> with subsequence matching, plus
`g`-then-key chords (`g` `t` → Tasks).

</td>
<td valign="top">

### 🌓 Light & dark
One design-token layer drives both themes, spacing and the whole type scale —
no ad-hoc values anywhere.

</td>
<td valign="top">

### 🐳 One image
Node builds the SPA, a slim Python image serves it and the API behind Gunicorn.
Same origin, so no CORS and no token in `localStorage`.

</td>
</tr>
</table>

---

## 📚 Documentation

The detail lives in focused documents — this page is the tour.

| Document | What's inside |
|---|---|
| 🏛 **[Architecture](docs/ARCHITECTURE.md)** | Layering, request lifecycle, ER diagram, module map, the N+1 fixes |
| 🛡 **[Security & RBAC](docs/SECURITY.md)** | Session design, CSRF, lockout, the full permission matrix, escalation rules |
| 🔌 **[API reference](docs/API.md)** | Every endpoint, its permission, its payload |
| 🧰 **[Development](docs/DEVELOPMENT.md)** | Local setup, MySQL/Postgres, tests, project layout, conventions |
| 🖼 **[Screenshots](docs/SCREENSHOTS.md)** | Every screen, light and dark, desktop and mobile |
| 🚀 **[Deployment](DEPLOYMENT.md)** | Docker, Render, Railway, Fly.io, environment variables |

---

## 🖼 A look around

<div align="center">

**Workspace overview** — live counts, assignment breakdown, recent activity

<img src="docs/screenshots/overview.png" alt="Overview dashboard" width="900">

<br><br>

**Task board** — five statuses, drag to move, priority and progress on every card

<img src="docs/screenshots/tasks-light.png" alt="Task board" width="900">

<br><br>

**Roles & permissions** — the server's permission map, rendered

<img src="docs/screenshots/admin-roles.png" alt="Roles and permissions matrix" width="900">

<br><br>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/my-tasks.png" alt="My tasks"><br><div align="center"><sub><b>My tasks</b> — what an employee sees</sub></div></td>
<td width="50%"><img src="docs/screenshots/command-palette.png" alt="Command palette"><br><div align="center"><sub><b>Command palette</b> — Ctrl/Cmd + K</sub></div></td>
</tr>
</table>

[**→ See every screen**](docs/SCREENSHOTS.md)

</div>

---

## 🏗 How it fits together

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#fff4ee','primaryTextColor':'#1c1917','primaryBorderColor':'#e8572a','lineColor':'#a8a29e','fontFamily':'ui-sans-serif, system-ui, sans-serif','fontSize':'14px'}}}%%
flowchart TB
    subgraph browser["🖥  Browser"]
        direction LR
        SPA["<b>React 18 + TypeScript</b><br/>Vite · React Router · TanStack Query<br/><code>web/src</code>"]
    end

    subgraph server["🐍  Flask container"]
        direction TB
        STATIC["<b>Static handler</b><br/>serves the built SPA<br/>index.html fallback"]
        MW["<b>Middleware</b><br/>CSRF · CSP · HSTS · request id"]
        R["<b>routes/</b><br/>parse · delegate · respond"]
        S["<b>services/</b><br/>all business rules & validation"]
        P["<b>permissions.py</b><br/>role → permission map"]
        M["<b>models/</b><br/>SQLAlchemy 2.0 ORM"]
    end

    DB[("<b>PostgreSQL</b><br/>MySQL · SQLite<br/>Alembic migrations")]

    SPA -->|"same-origin fetch<br/>session cookie + X-CSRF-Token"| MW
    browser -.->|"first paint"| STATIC
    MW --> R
    R --> S
    R -.->|"can(role, perm)"| P
    S -.->|"can(role, perm)"| P
    S --> M
    M --> DB

    classDef front fill:#fff4ee,stroke:#e8572a,stroke-width:2px,color:#1c1917
    classDef back fill:#eef6ff,stroke:#3b82f6,stroke-width:2px,color:#1c1917
    classDef guard fill:#fef6e7,stroke:#f59e0b,stroke-width:2px,color:#1c1917
    classDef data fill:#ecfdf5,stroke:#14b8a6,stroke-width:2px,color:#1c1917

    class SPA front
    class STATIC,MW,R,S,M back
    class P guard
    class DB data
```

**One origin.** In production Flask serves the compiled Vite bundle itself. That
keeps the session cookie first-party — which means no CORS configuration, and no
access token sitting in `localStorage` for an XSS payload to steal.

**Strict layering.** A route handler parses the request, calls a service, and
shapes the response — nothing else. Every business rule lives in `services/`,
which is why the same validation applies whether a task arrives through the API,
the seed script, or the CLI.

[**→ Full architecture, with the request lifecycle and the ER diagram**](docs/ARCHITECTURE.md)

---

## 🔐 Who can do what

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#fff4ee','primaryTextColor':'#1c1917','primaryBorderColor':'#e8572a','lineColor':'#a8a29e','fontFamily':'ui-sans-serif, system-ui, sans-serif'}}}%%
flowchart LR
    SA["<b>L6 Super admin</b><br/>everything"]
    AD["<b>L5 Admin</b><br/>everything"]
    HR["<b>L4 HR</b><br/>people + departments"]
    AU["<b>L4 Auditor</b><br/>read-only, everywhere"]
    MA["<b>L3 Manager</b><br/>own department"]
    TL["<b>L2 Team lead</b><br/>own department"]
    EM["<b>L1 Employee</b><br/>own assignments"]

    SA --> AD --> HR & AU
    HR --> MA --> TL --> EM
    AU -.-> EM

    classDef l6 fill:#fff1ec,stroke:#e8572a,stroke-width:2px,color:#1c1917
    classDef l5 fill:#fef6e7,stroke:#d97706,stroke-width:2px,color:#1c1917
    classDef l4 fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#1c1917
    classDef l3 fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#1c1917
    classDef l2 fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#1c1917
    classDef l1 fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1c1917

    class SA l6
    class AD l5
    class HR,AU l4
    class MA l3
    class TL l2
    class EM l1
```

Roles are **ranked**. You can only grant a role below your own, and only touch
accounts below your own — so nobody can mint a peer or a superior. Managers and
team leads are **department-scoped**. Super admins and admins come through a
separate door (`/admin/login`) with a 30-minute idle timeout.

Authorization is enforced **server-side on every endpoint**. The React route
guards exist for UX only — anything decided in the browser can be edited in the
browser, so `backend/tests/test_authorization.py` asserts the real rules.

[**→ The full matrix, and how the session is built**](docs/SECURITY.md)

---

## ⚡ Run it locally

**Requirements:** Python 3.11+, Node 20+. No database server needed — it falls
back to SQLite.

```bash
git clone https://github.com/ayushYadav1107/TaskForge.git
cd TaskForge
```

<table>
<tr><td width="50%" valign="top">

**API** — terminal 1

```bash
cd backend
python -m venv venv
venv/Scripts/activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
flask --app task_management seed
python run.py                # :5000
```

</td><td width="50%" valign="top">

**Front end** — terminal 2

```bash
cd web
npm install
npm run dev                  # :5173
```

Vite proxies `/api` to port 5000, so the
cookie stays first-party in dev exactly
as it is in production.

</td></tr>
</table>

### 🔑 Demo logins

Created by `flask seed`:

| | Role | Username | Password | Door |
|:-:|---|---|---|---|
| 🟠 | Super admin | `ayush.yadav` | `Ayush@123` | `/admin/login` |
| 🟡 | Admin | `meera.nair` | `Admin@123` | `/admin/login` |
| 🩷 | HR | `neha.kapoor` | `Hr@12345` | `/login` |
| 🟣 | Manager · Engineering | `priya.mehta` | `Manager@123` | `/login` |
| 🔵 | Team lead · Engineering | `vikram.rao` | `Lead@1234` | `/login` |
| ⚪ | Auditor | `isha.menon` | `Audit@123` | `/login` |
| 🟢 | Employee | `aarav.sharma` | `Employee@123` | `/login` |

Build with `VITE_DEMO_MODE=true` to show these on the sign-in page. A real deploy
mints a random admin password on first boot instead.

[**→ MySQL/Postgres setup, scripts and conventions**](docs/DEVELOPMENT.md)

---

## 🧪 Tests

**116 tests.** No database server, no browser.

```bash
cd backend && pytest -q      #  89 — auth, RBAC, CSRF, tasks, roles, deploy config
cd web && npm run test       #  27 — API client, session query, formatting
```

The backend suite runs on in-memory SQLite with a fresh schema per test. The most
load-bearing file is `test_authorization.py`: it pins every rule in the permission
matrix, including the ones that were originally wrong.

`test_config.py` is worth a look too — it pins the database-URL normalisation that
decides whether a deploy boots at all. Managed hosts hand out `postgres://`, which
SQLAlchemy 2 rejects outright, and that failure cannot be reproduced locally
against SQLite.

---

## 🧱 Stack

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#fff4ee','primaryTextColor':'#1c1917','primaryBorderColor':'#e8572a','lineColor':'#a8a29e','fontFamily':'ui-sans-serif, system-ui, sans-serif'}}}%%
mindmap
  root(("TaskForge"))
    Front end
      React 18
      TypeScript 5.6
      Vite 5
      TanStack Query 5
      React Router 6
      Lucide icons
    Back end
      Flask 3
      SQLAlchemy 2.0
      Alembic
      Gunicorn
      Werkzeug scrypt
    Data
      PostgreSQL
      MySQL
      SQLite
    Quality
      pytest
      Vitest
      Testing Library
      Ruff
      GitHub Actions
    Delivery
      Docker multi-stage
      Render blueprint
      Health probes
```

---

## 🧠 Engineering notes

<details>
<summary><b>Authorization was the real bug</b></summary>
<br>

The first version guarded task and assignment endpoints with *"is logged in"*
rather than *"is allowed"*, so any employee could delete tasks and edit other
people's progress. Fixing it meant separating authentication from authorization
and writing the tests that prove the difference.

</details>

<details>
<summary><b>N+1 queries in the list and the dashboard</b></summary>
<br>

The task list issued one `COUNT` per task, and the dashboard loaded every
assignment row into Python to tally statuses. Both are now a single `GROUP BY`.

</details>

<details>
<summary><b>Naive UTC timestamps</b></summary>
<br>

The API serialised `datetime.utcnow()` with no zone marker, so the browser read
every timestamp as local time and labelled everything "just now". Pinned in
`format.test.ts`.

</details>

<details>
<summary><b>Logout raced its own redirect</b></summary>
<br>

Clearing the query cache left the auth query pending, so the route guard read the
last known user for one render and bounced straight back to the dashboard.
Signed-out is now modelled as data (`null`), not as an absent value.

</details>

<details>
<summary><b>Why not JWT?</b></summary>
<br>

Same-origin SPA, so a cookie is strictly better: `HttpOnly` means a script cannot
read it, and revocation is immediate. A token in `localStorage` buys nothing here
and is readable by any injected script.

</details>

<details>
<summary><b>Why the role is re-read every request</b></summary>
<br>

Caching the role in the session means a demotion takes effect whenever the cookie
happens to expire. Re-reading it from the database on each request costs one
indexed lookup and makes the demotion bind immediately.

</details>

---

<div align="center">

Built by **Ayush Yadav** · [MIT](LICENSE)

</div>
