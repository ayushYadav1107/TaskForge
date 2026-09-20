import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/ProtectedRoute";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { ToastProvider } from "./components/Toast";
import { AppShell } from "./layout/AppShell";
import { Activity } from "./pages/Activity";
import { Departments } from "./pages/Departments";
import { Employees } from "./pages/Employees";
import { Login } from "./pages/Login";
import { MyTasks } from "./pages/MyTasks";
import { NotFound } from "./pages/NotFound";
import { Overview } from "./pages/Overview";
import { Profile } from "./pages/Profile";
import { Signup } from "./pages/Signup";
import { Tasks } from "./pages/Tasks";
import { ThemeProvider } from "./theme";

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>

              {/* Manager-and-above screens. The same rules are enforced on the
                  server; these routes only keep the UI honest. */}
              <Route element={<ProtectedRoute roles={["admin", "manager"]} />}>
                <Route element={<AppShell />}>
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/departments" element={<Departments />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute roles={["admin"]} />}>
                <Route element={<AppShell />}>
                  <Route path="/activity" element={<Activity />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/my-tasks" element={<MyTasks />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
