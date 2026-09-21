import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { landingFor, useAuth } from "../auth/AuthContext";
import { Field, FormError } from "../components/ui";
import { AuthLayout, DemoAccounts } from "./AuthLayout";

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
    <AuthLayout
      headline="Work, assigned and accounted for."
      lede="Plan tasks, assign them to your team, and track completion without chasing status updates."
    >
      <div className="auth-card">
        <div className="auth-mobile-brand">
          <span className="brand-mark">TF</span>
          TaskForge
        </div>

        <h1>Sign in</h1>
        <p className="auth-card-sub">Welcome back to your workspace.</p>

        <FormError message={error} />

        <form onSubmit={onSubmit} noValidate>
          <Field label="Username" htmlFor="username">
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-alt">
          New here? <Link to="/signup">Create an account</Link>
        </p>

        <DemoAccounts
          onPick={(user, pass) => {
            setUsername(user);
            setPassword(pass);
          }}
        />
      </div>
    </AuthLayout>
  );
}
