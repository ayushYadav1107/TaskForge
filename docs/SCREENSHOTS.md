<div align="center">

# 🖼 Screenshots

**[← Back to README](../README.md)** · [Architecture](ARCHITECTURE.md) · [Security](SECURITY.md) · [API](API.md) · [Development](DEVELOPMENT.md) · [Deployment](../DEPLOYMENT.md)

</div>

---

Every screen below is the real app, captured against seeded data. Roles see
different navigation and different screens — that is the point, so each shot
says who is signed in.

---

## 🔐 Sign in

<div align="center">
<img src="screenshots/login.png" alt="Workspace sign-in" width="920">
<br><sub><b>/login</b> — the workspace door. Employees, team leads, managers, HR and auditors.<br>The demo account list only appears when the bundle is built with <code>VITE_DEMO_MODE=true</code>.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/admin-login.png" alt="Admin console sign-in" width="920">
<br><sub><b>/admin/login</b> — the console door. Super admins and admins sign in only here,<br>and their session carries a flag that ordinary sign-ins never get.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/signup.png" alt="Sign up" width="920">
<br><sub><b>/signup</b> — self-registration always creates a plain <code>employee</code>.<br>The department picker is fed by a public endpoint, because there is no session yet.</sub>
</div>

---

## 📊 Workspace

<div align="center">
<img src="screenshots/overview.png" alt="Overview dashboard, dark" width="920">
<br><sub><b>/overview</b> · super admin · dark — counts, the assignment breakdown (one <code>GROUP BY</code>)<br>and the ten most recent audit entries.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/tasks.png" alt="Task board, dark" width="920">
<br><sub><b>/tasks</b> · super admin · dark — five status columns, drag a card to move it.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/tasks-light.png" alt="Task board, light" width="920">
<br><sub><b>/tasks</b> · manager · light — the same screen, the other theme. Board or list,<br>search, priority filter, and progress on every card.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/employees.png" alt="People directory, dark" width="920">
<br><sub><b>/employees</b> · super admin · dark — the whole organisation.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/employees-light.png" alt="People directory, manager" width="920">
<br><sub><b>/employees</b> · manager · light — <b>the same route, fewer rows.</b> A manager is
department-scoped,<br>and the filtering happens on the server, not in the browser.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/departments.png" alt="Departments" width="920">
<br><sub><b>/departments</b> · super admin · dark — headcount and member avatars per department.<br>Creating one needs <code>departments.manage</code> — super admin, admin or HR.</sub>
</div>

---

## 🧾 Audit

<div align="center">
<img src="screenshots/activity.png" alt="Audit log" width="920">
<br><sub><b>/activity</b> · super admin · dark — append-only, newest first, filterable by action type.<br>Each row names the actor, the action and the entity; the stored row also carries the full<br>JSON before/after state. Readable by super admin, admin and auditor.</sub>
</div>

---

## 🛡 Admin console

<div align="center">
<img src="screenshots/admin-people.png" alt="Admin people console" width="920">
<br><sub><b>/admin</b> · super admin · dark — active people, admins, locked accounts and roles in use,<br>with a filter chip per cohort. Re-role inline, add, deactivate or unlock.<br>The role dropdown only ever offers roles ranked below your own.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/admin-roles.png" alt="Roles and permissions" width="920">
<br><sub><b>/admin/roles</b> — the server's permission map, rendered. Seven roles, their rank,<br>their scope, and every permission each one holds. Nothing here is hardcoded in the UI:<br>it is <code>GET /api/admin/roles</code>, which reads <code>permissions.py</code>.</sub>
</div>

---

## 👤 Employee view

<div align="center">
<img src="screenshots/my-tasks.png" alt="My tasks" width="920">
<br><sub><b>/my-tasks</b> · employee — two nav items, and only their own work.<br>Updating status is the one mutation every role can reach, and only on a row they own.</sub>
</div>

<br>

<div align="center">
<img src="screenshots/profile.png" alt="Profile" width="920">
<br><sub><b>/profile</b> · employee · light — own details and password change.<br>The one screen every role can reach.</sub>
</div>

---

## ⌨️ Command palette

<div align="center">
<img src="screenshots/command-palette.png" alt="Command palette" width="920">
<br><sub><kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd> — subsequence matching, arrow keys to navigate,<br><kbd>Esc</kbd> to close. Each row shows its <code>g</code>-chord: <code>g</code> <code>t</code> for Tasks, <code>g</code> <code>a</code> for the audit log.<br>The list is built from the same navigation source the sidebar uses, so it can never drift.</sub>
</div>

---

## 📱 Mobile

<div align="center">
<img src="screenshots/mobile-my-tasks.png" alt="My tasks on mobile" width="380">
<br><sub><b>/my-tasks</b> at 414px — the stat row reflows to a 2×2 grid, the panels stack,<br>and the sidebar collapses behind a drawer toggle.</sub>
</div>

---

## 🌓 Both themes

Light and dark are not two stylesheets. `web/src/styles/tokens.css` defines one
set of semantic tokens — surface, border, text, accent, status — and redefines
their values under `[data-theme="dark"]`. Components reference the token, never
a hex value, so a new screen gets both themes for free.

The choice is persisted, and defaults to the operating system's
`prefers-color-scheme` on a first visit.

---

<div align="center">

**[← Development](DEVELOPMENT.md)** · **[Deployment →](../DEPLOYMENT.md)**

</div>
