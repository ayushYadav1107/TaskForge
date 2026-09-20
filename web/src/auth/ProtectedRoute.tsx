import { Navigate, Outlet, useLocation } from "react-router-dom";

import type { Role } from "../api/types";
import { FullPageSpinner } from "../components/Spinner";
import { landingFor, useAuth } from "./AuthContext";

/**
 * Route guard. This is a UX convenience only — every one of these rules is
 * also enforced server-side, because anything decided in the browser can be
 * edited in the browser.
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={landingFor(user)} replace />;

  return <Outlet />;
}

/** Bounces an already-signed-in visitor away from login and signup. */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to={landingFor(user)} replace />;

  return <Outlet />;
}
