<div align="center">

# 🧰 Development

**[← Back to README](../README.md)** · [Architecture](ARCHITECTURE.md) · [Security](SECURITY.md) · [API](API.md) · [Screenshots](SCREENSHOTS.md) · [Deployment](../DEPLOYMENT.md)

</div>

---

## Requirements

| | Version | Note |
|---|---|---|
| Python | 3.11+ | 3.12 in CI and in the Docker image |
| Node | 20+ | Only needed to build the SPA |
| Database | — | **Optional.** Falls back to a SQLite file |

---

## 🚀 First run

```bash
git clone https://github.com/ayushYadav1107/TaskForge.git
cd TaskForge
```

### API — terminal 1

```bash
cd backend
python -m venv venv
venv/Scripts/activate                  # macOS/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
flask --app task_management seed       # demo data + the logins below
python run.py                          # http://localhost:5000
```

### Front end — terminal 2

```bash
cd web
npm install
npm run dev                            # http://localhost:5173
```

Vite proxies `/api` to port 5000, so the session cookie stays first-party in dev
exactly as it is in production. Open **http://localhost:5173**.

> To show the demo accounts on the sign-in page, run the dev server or the build
> with `VITE_DEMO_MODE=true`.

### 🔑 Demo logins

| Role | Username | Password | Door |
|---|---|---|---|
| Super admin | `ayush.yadav` | `Ayush@123` | `/admin/login` |
| Admin | `meera.nair` | `Admin@123` | `/admin/login` |
| HR | `neha.kapoor` | `Hr@12345` | `/login` |
| Manager · Engineering | `priya.mehta` | `Manager@123` | `/login` |
| Team lead · Engineering | `vikram.rao` | `Lead@1234` | `/login` |
| Auditor | `isha.menon` | `Audit@123` | `/login` |
| Employee | `aarav.sharma` | `Employee@123` | `/login` |

`flask seed` is idempotent — re-running it will not duplicate anything.

---

## 🗄 Using MySQL or Postgres instead

One variable in `backend/.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/taskforge
# or
DATABASE_URL=mysql://root:password@localhost:3306/taskforge
```

For a local Postgres:

```bash
docker compose up -d db
# → postgresql://taskforge:taskforge@localhost:5432/taskforge
```

Hosted URLs from Neon, Supabase, Railway or Render can be pasted as-is —
`config.py` normalises `postgres://` and bare `mysql://` to the installed driver
before SQLAlchemy sees them. Migrations run on boot.

`database/schema.sql` holds the original hand-written MySQL schema. Alembic is
the source of truth now; that file is kept for reference.

---

## 🧪 Tests

**116 tests.** No database server, no browser, no network.

```bash
cd backend && pytest -q          #  89
cd web && npm run test           #  27
```

| Suite | Covers |
|---|---|
| `test_auth.py` | Register, login, logout, change password, lockout, enumeration resistance |
| `test_authorization.py` | Every rule in the permission matrix — the most load-bearing file in the repo |
| `test_roles.py` | Rank, grantable roles, department scope, the two doors |
| `test_security.py` | CSRF enforcement, security headers, request ids |
| `test_tasks.py` | Task and assignment lifecycle, validation, soft delete |
| `test_config.py` | Database-URL normalisation and production boot refusals |
| `hooks.test.tsx` | Query hooks, session state, signed-out modelled as `null` |
| `client.test.ts` | Fetch client, CSRF header, error mapping |
| `format.test.ts` | Timestamp and number formatting — pins the naive-UTC bug |

The backend suite runs on in-memory SQLite with a fresh schema per test, which
is why it needs nothing installed.

> `test_config.py` earns its place: managed hosts hand out `postgres://`, which
> SQLAlchemy 2 rejects outright, and that failure cannot be reproduced locally
> against SQLite. It is the difference between a deploy that boots and one that
> crashes before its first request.

---

## 🧭 Scripts

### Backend

| Command | Does |
|---|---|
| `python run.py` | Dev server on `:5000` with reload |
| `flask --app task_management seed` | Demo departments, people and tasks |
| `pytest -q` | The suite |
| `ruff check .` | Lint — config in `backend/ruff.toml` |
| `flask --app task_management db migrate -m "…"` | New Alembic revision |
| `flask --app task_management db upgrade` | Apply migrations |

### Front end

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | Type-check then build to `web/dist` |
| `npm run preview` | Serve the built bundle |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |

---

## 🗂 Project layout

```
backend/
  task_management/
    __init__.py          app factory, SPA handler, error handlers, first-boot bootstrap
    config.py            env-driven, multi-engine, URL normalisation
    extensions.py        db, migrate
    permissions.py       ROLES, LEVEL, PERMISSIONS — the single source of truth
    auth_decorators.py   login_required, permission_required, department scoping
    security.py          CSRF, security headers, request ids
    seed.py              demo data, idempotent
    models/              SQLAlchemy models
    routes/              HTTP layer — parse, delegate, respond
    services/            business rules and validation
  migrations/            Alembic
  tests/                 pytest
  gunicorn.conf.py       production worker config

web/
  src/
    api/                 typed client + TanStack Query hooks
    auth/                session context and route guards
    components/          Modal, Toast, ConfirmDialog, CommandPalette, primitives
    layout/              app shell + single source of truth for navigation
    pages/               one file per screen
    styles/              tokens.css, base.css, components.css, lively.css
    lib/                 formatting helpers
    theme.tsx            light/dark

docs/                    these pages, and the screenshots
database/schema.sql      original hand-written MySQL schema (reference)
Dockerfile               two-stage build
docker-compose.yml       local Postgres
render.yaml              one-click Render blueprint
railway.toml             Railway build + health check
```

---

## 📐 Conventions

**Backend**

- A route parses, calls **one** service, and shapes the response. No business
  logic in a handler, ever.
- A service raises a domain error from `services/errors.py`; nobody builds an
  error response by hand.
- Check **permissions**, never role names. Adding a role should mean editing
  `permissions.py` and nothing else.
- Every mutation logs to `activity_logs` with before/after state.
- Ruff, 100-column lines, comments explain *why* rather than *what*.

**Front end**

- Server state lives in TanStack Query. There is no second store mirroring rows
  the server already owns.
- Colour, spacing and type come from `styles/tokens.css`. No ad-hoc hex values
  in a component.
- Dialogs trap focus, toasts are `aria-live`, sortable headers are real buttons,
  and `prefers-reduced-motion` is honoured.
- Navigation is declared once in `layout/` — a new page is added there, not in
  three places.

---

## 🎨 Interface notes

The UI is built on a design-token layer rather than ad-hoc values, so both
themes, the spacing scale and the type scale all come from one file.

- **Dark-first, one accent.** Surfaces are near-black (or warm off-white in
  light mode) with 1px borders; the orange accent appears on focus rings, the
  active nav row and primary buttons only. Status is carried by a 6px coloured
  dot rather than a saturated pill, so a column of them stays scannable.
- **A real type scale** with tabular numerals, so figures line up column to
  column and each screen has one focal point instead of ten competing ones.
- **Borders over shadows.** Elevation is reserved for things that genuinely
  float — dialogs, the command palette, toasts.
- **Command palette** at <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd> with
  subsequence matching, plus `g`-then-key chords (`g` `t` → Tasks).
- **Self-hosted type** — Bricolage Grotesque for display, Manrope for text,
  JetBrains Mono for code and figures. All three ship with the bundle, so the
  strict CSP needs no `font-src` exception and there is no third-party request
  on first paint.
- **Lucide** icons, imported per-icon so the bundle only carries what is used.

See [Screenshots](SCREENSHOTS.md) for every screen in both themes.

---

## ⚙️ Environment variables

The ones that matter in development:

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | SQLite file | `postgres://`, `postgresql://` and `mysql://` all normalise |
| `SECRET_KEY` | dev default | **Required** in production — the app refuses to boot without it |
| `APP_ENV` | `development` | `production` turns on secure cookies and HSTS |
| `MAX_FAILED_LOGINS` | `5` | |
| `LOCKOUT_MINUTES` | `15` | |
| `MIN_PASSWORD_LENGTH` | `8` | |
| `ADMIN_IDLE_MINUTES` | `30` | Console session idle timeout |
| `SESSION_LIFETIME_SECONDS` | `43200` | 12 hours |
| `VITE_DEMO_MODE` | unset | `true` shows demo accounts on the sign-in page |

The full list, including the deploy-only variables, is in
[DEPLOYMENT.md](../DEPLOYMENT.md#environment-variables).

---

## 🩺 Troubleshooting

**`Can't load plugin: sqlalchemy.dialects:postgres`** — an old build without URL
normalisation. Confirm the fix with `pytest tests/test_config.py`.

**The signup department dropdown is empty** — bootstrap did not run. Check the
boot log for `Bootstrap skipped — database not ready`.

**403 on every mutation** — the `X-CSRF-Token` header is missing. The typed
client adds it automatically; a raw `fetch` or `curl` must echo the
`taskforge_csrf` cookie itself.

**Signed out after every restart** — `SECRET_KEY` is changing between runs. Pin
it in `backend/.env`.

---

<div align="center">

**[← API](API.md)** · **[Screenshots →](SCREENSHOTS.md)**

</div>
