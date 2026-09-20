import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/ui";
import { useTheme } from "../theme";

interface NavEntry {
  to: string;
  label: string;
  icon: string;
  managerOnly?: boolean;
  adminOnly?: boolean;
}

const NAV: NavEntry[] = [
  { to: "/overview", label: "Overview", icon: "◆", managerOnly: true },
  { to: "/tasks", label: "Tasks", icon: "☰", managerOnly: true },
  { to: "/employees", label: "Employees", icon: "◉", managerOnly: true },
  { to: "/departments", label: "Departments", icon: "▣", managerOnly: true },
  { to: "/activity", label: "Activity Log", icon: "◷", adminOnly: true },
  { to: "/my-tasks", label: "My Tasks", icon: "✓" },
  { to: "/profile", label: "Profile", icon: "☺" },
];

export const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/overview": { title: "Overview", subtitle: "How the whole workspace is tracking." },
  "/tasks": { title: "Tasks", subtitle: "Create work and assign it to your team." },
  "/employees": { title: "Employees", subtitle: "Everyone with an account in the workspace." },
  "/departments": { title: "Departments", subtitle: "How the organisation is divided up." },
  "/activity": { title: "Activity Log", subtitle: "Every change, who made it, and when." },
  "/my-tasks": { title: "My Tasks", subtitle: "Everything currently on your plate." },
  "/profile": { title: "Profile", subtitle: "Your account details and password." },
};

export function AppShell() {
  const { user, canManage, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A route change on mobile should close the drawer, otherwise the new page
  // renders underneath a menu the visitor has to dismiss by hand.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const meta = PAGE_META[location.pathname] ?? { title: "TaskForge", subtitle: "" };
  const employee = user?.employee;

  const visible = NAV.filter((entry) => {
    if (entry.adminOnly) return isAdmin;
    if (entry.managerOnly) return canManage;
    return true;
  });

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <div
        className={`nav-scrim${drawerOpen ? " visible" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="app-shell">
        <aside className={`sidebar${drawerOpen ? " open" : ""}`} id="sidebar">
          <div className="brand-mark">
            <span className="logo-dot">TF</span>
            <span className="brand-word">TaskForge</span>
          </div>

          <nav aria-label="Main">
            <div className="nav-section-label">Workspace</div>
            {visible.map((entry) => (
              <NavLink
                key={entry.to}
                to={entry.to}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              >
                <span className="nav-icon" aria-hidden="true">
                  {entry.icon}
                </span>
                <span className="nav-label">{entry.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button type="button" className="nav-item" onClick={toggleTheme}>
              <span className="nav-icon" aria-hidden="true">
                ◐
              </span>
              <span className="nav-label">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
            <button type="button" className="nav-item" onClick={handleLogout}>
              <span className="nav-icon" aria-hidden="true">
                ⏻
              </span>
              <span className="nav-label">Log out</span>
            </button>
          </div>
        </aside>

        <main className="main" id="main-content">
          <div className="topbar">
            <div className="topbar-lead">
              <button
                type="button"
                className="nav-toggle"
                onClick={() => setDrawerOpen((open) => !open)}
                aria-expanded={drawerOpen}
                aria-controls="sidebar"
                aria-label="Toggle navigation"
              >
                ☰
              </button>
              <div>
                <h1>{meta.title}</h1>
                <div className="sub">{meta.subtitle}</div>
              </div>
            </div>

            <div className="topbar-actions">
              <div className="topbar-identity">
                <div className="topbar-name">
                  {employee ? `${employee.first_name} ${employee.last_name}` : user?.username}
                </div>
                <div className="topbar-role">{user?.role}</div>
              </div>
              <Avatar
                first={employee?.first_name ?? user?.username}
                last={employee?.last_name}
                seed={user?.username}
                size={38}
              />
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </>
  );
}
