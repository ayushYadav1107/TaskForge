import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError, api } from "../api/client";
import type { Department } from "../api/types";
import { landingFor, useAuth } from "../auth/AuthContext";
import { FormError } from "../components/ui";
import { AuthBrandPanel } from "./AuthBrandPanel";

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department_id: "",
  position: "",
  username: "",
  password: "",
};

export function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState(EMPTY);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The department picker is public on purpose: a visitor has to choose one
  // before they have an account to authenticate with.
  useEffect(() => {
    api
      .get<{ departments: Department[] }>("/api/auth/departments")
      .then((response) => {
        setDepartments(response.departments);
        setFields((current) =>
          current.department_id
            ? current
            : { ...current, department_id: String(response.departments[0]?.id ?? "") },
        );
      })
      .catch(() => setError("Could not load departments. Please refresh and try again."));
  }, []);

  function set(key: keyof typeof EMPTY) {
    return (event: { target: { value: string } }) =>
      setFields((current) => ({ ...current, [key]: event.target.value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await register({ ...fields, department_id: Number(fields.department_id) });
      navigate(landingFor(user), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <AuthBrandPanel
        heading={
          <>
            Join your team
            <br />
            in under a minute.
          </>
        }
        lede="Create your employee account, pick your department, and your manager can start assigning you work straight away."
      />

      <section className="auth-form-side">
        <div className="auth-card auth-card--wide">
          <div className="auth-mobile-head">
            <span className="logo-dot">TF</span>
            <span>TaskForge</span>
          </div>

          <h2>Create your account</h2>
          <p className="sub">
            Sign up as an employee — managers and admins are created by an administrator.
          </p>

          <FormError message={error} />

          <form onSubmit={onSubmit} noValidate>
            <div className="form-row">
              <div className="field">
                <label htmlFor="first-name">First name</label>
                <input id="first-name" autoComplete="given-name" value={fields.first_name} onChange={set("first_name")} required />
              </div>
              <div className="field">
                <label htmlFor="last-name">Last name</label>
                <input id="last-name" autoComplete="family-name" value={fields.last_name} onChange={set("last_name")} required />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" value={fields.email} onChange={set("email")} required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" autoComplete="tel" value={fields.phone} onChange={set("phone")} required />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="department">Department</label>
                <select id="department" value={fields.department_id} onChange={set("department_id")} required>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="position">Role / position</label>
                <input id="position" placeholder="e.g. Software Engineer" value={fields.position} onChange={set("position")} />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="new-username">Username</label>
                <input id="new-username" autoComplete="username" value={fields.username} onChange={set("username")} required />
                <div className="hint">Letters, numbers, dot, dash or underscore.</div>
              </div>
              <div className="field">
                <label htmlFor="new-password">Password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={fields.password}
                  onChange={set("password")}
                  required
                />
                <div className="hint">At least 8 characters, with a letter and a number.</div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
