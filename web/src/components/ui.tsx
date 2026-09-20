import type { ReactNode } from "react";

import { avatarStyle, badgeClass, initials } from "../lib/format";

/* --------------------------------- Badge --------------------------------- */

export function Badge({ value }: { value?: string | null }) {
  if (!value) return null;
  return <span className={`badge ${badgeClass(value)}`}>{value}</span>;
}

/* -------------------------------- Avatar --------------------------------- */

export function Avatar({
  first,
  last,
  seed,
  size = 34,
}: {
  first?: string | null;
  last?: string | null;
  seed?: string | null;
  size?: number;
}) {
  const text = initials(first, last);
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ ...avatarStyle(seed ?? `${first}${last}`), width: size, height: size, fontSize: size * 0.38 }}
    >
      {text}
    </span>
  );
}

/* ------------------------------- Stat card -------------------------------- */

export function StatCard({
  label,
  value,
  suffix = "",
  hint,
  icon,
  index = 0,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
  index?: number;
}) {
  return (
    <div className="stat-card animate-in" style={{ ["--i" as string]: index }}>
      {icon ? <div className="stat-icon">{icon}</div> : null}
      <div className="stat-value">
        {value}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

/* ------------------------------ Progress ring ----------------------------- */

export function ProgressRing({ percent, size = 128 }: { percent: number; size?: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d5ef8" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference * (1 - clamped / 100),
          }}
        />
      </svg>
      <div className="ring-label">{Math.round(clamped)}%</div>
    </div>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 200 150" fill="none" aria-hidden="true">
        <ellipse cx="100" cy="132" rx="62" ry="8" fill="currentColor" opacity=".08" />
        <rect x="52" y="26" width="96" height="102" rx="10" fill="currentColor" opacity=".07" />
        <rect
          x="52"
          y="26"
          width="96"
          height="102"
          rx="10"
          stroke="currentColor"
          strokeOpacity=".22"
          strokeWidth="2"
        />
        <rect x="68" y="14" width="64" height="22" rx="7" fill="currentColor" opacity=".16" />
        <rect x="68" y="56" width="52" height="7" rx="3.5" fill="currentColor" opacity=".26" />
        <rect x="68" y="72" width="64" height="7" rx="3.5" fill="currentColor" opacity=".18" />
        <rect x="68" y="88" width="40" height="7" rx="3.5" fill="currentColor" opacity=".18" />
        <circle cx="140" cy="104" r="20" fill="var(--primary)" opacity=".14" />
        <path d="M132 104h16M140 96v16" stroke="var(--primary)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

export function SkeletonLines({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line" style={{ width: "62%" }} />
            <div className="skeleton skeleton-line" style={{ width: "38%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Card ----------------------------------- */

export function Card({
  title,
  actions,
  children,
  index = 0,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  index?: number;
}) {
  return (
    <section className="card animate-in" style={{ ["--i" as string]: index }}>
      {title || actions ? (
        <header className="card-header">
          {title ? <h2>{title}</h2> : <span />}
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/* --------------------------------- Field ---------------------------------- */

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

/** Inline form error, announced to assistive tech the moment it appears. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="field-error" role="alert">
      {message}
    </div>
  );
}
