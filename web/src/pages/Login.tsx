import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { landingFor, useAuth } from "../auth/AuthContext";
import { FormError } from "../components/ui";
import { AuthBrandPanel, DemoCredentials } from "./AuthBrandPanel";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(username.trim(), password);
      navigate(landingFor(user), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <AuthBrandPanel
        heading={
          <>
            Assign work.
            <br />
            Track progress.
            <br />
            Ship on time.
          </>
        }
        lede="A task and workforce platform — manage departments, employees and tasks, then watch completion move in real time."
      />

      <section className="auth-form-side">
        <div className="auth-card">
          <div className="auth-mobile-head">
            <span className="logo-dot">TF</span>
            <span>TaskForge</span>
          </div>

          <h2>Welcome back</h2>
          <p className="sub">Sign in to your TaskForge workspace</p>

          <FormError message={error} />

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-alt">
            New here? <Link to="/signup">Create an account</Link>
          </p>

          <DemoCredentials />
        </div>
      </section>
    </div>
  );
}
