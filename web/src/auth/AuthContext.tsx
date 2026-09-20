import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "../api/client";
import { keys, useMe } from "../api/hooks";
import type { Role, User } from "../api/types";

interface AuthValue {
  user: User | null;
  isLoading: boolean;
  /** True for admin and manager — the roles that own the backlog. */
  canManage: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (fields: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useMe();

  const adopt = useCallback(
    (next: User) => {
      // Seed the cache from the login response so the first authenticated
      // render doesn't flash a spinner while /me round-trips again.
      queryClient.setQueryData(keys.me, next);
      return next;
    },
    [queryClient],
  );

  const value = useMemo<AuthValue>(() => {
    const role: Role | undefined = user?.role;
    return {
      user: user ?? null,
      isLoading,
      canManage: role === "admin" || role === "manager",
      isAdmin: role === "admin",
      login: (username, password) =>
        api
          .post<{ user: User }>("/api/auth/login", { username, password })
          .then((r) => adopt(r.user)),
      register: (fields) =>
        api.post<{ user: User }>("/api/auth/register", fields).then((r) => adopt(r.user)),
      logout: async () => {
        try {
          await api.post("/api/auth/logout");
        } finally {
          // Drop every cached query — otherwise the next person to sign in on
          // this browser briefly sees the previous user's data.
          queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
          // Then record "signed out" as a settled answer rather than clearing
          // the entry. Clearing it leaves the query pending, and the route
          // guard reads the last known user for one render and bounces the
          // redirect straight back to the dashboard.
          queryClient.setQueryData(keys.me, null);
        }
      },
    };
  }, [user, isLoading, adopt, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

/** Where a given role lands after signing in. */
export function landingFor(user: Pick<User, "role">) {
  return user.role === "employee" ? "/my-tasks" : "/overview";
}
