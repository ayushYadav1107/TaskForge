import { useStats } from "../api/hooks";
import type { ActivityEntry, Status } from "../api/types";
import { relativeTime } from "../lib/format";
import { Card, EmptyState, ProgressRing, SkeletonLines, StatCard } from "../components/ui";

const STATUS_ORDER: Status[] = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"];

const ACTION_ICONS: Record<string, string> = {
  CREATE: "+",
  UPDATE: "✎",
  DELETE: "×",
  LOGIN: "→",
  REGISTER: "☺",
  CHANGE_PASSWORD: "🔒",
  SEED: "◆",
};

export function Overview() {
  const { data, isLoading, isError } = useStats();

  if (isError) {
    return (
      <Card>
        <EmptyState title="Could not load the dashboard" message="Please refresh and try again." />
      </Card>
    );
  }

  const stats = data?.stats;
  const activity = data?.recent_activity ?? [];
  const total = stats?.total_assignments ?? 0;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Tasks" value={stats?.total_tasks ?? "—"} icon="☰" index={0} />
        <StatCard label="Employees" value={stats?.total_employees ?? "—"} icon="◉" index={1} />
        <StatCard label="Departments" value={stats?.total_departments ?? "—"} icon="▣" index={2} />
        <StatCard
          label="Completion rate"
          value={stats?.completion_rate ?? "—"}
          suffix={stats ? "%" : ""}
          icon="✓"
          index={3}
        />
      </div>

      <div className="two-column">
        <Card title="Assignment progress" index={4}>
          <div className="ring-wrap">
            <ProgressRing percent={stats?.completion_rate ?? 0} />
            <div className="status-breakdown">
              {STATUS_ORDER.map((status) => {
                const count = stats?.by_status?.[status] ?? 0;
                const share = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="status-row">
                    <div className="status-row-head">
                      <span>{status}</span>
                      <strong>{count}</strong>
                    </div>
                    <div
                      className="meter"
                      role="meter"
                      aria-valuenow={share}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${status}: ${count} of ${total}`}
                    >
                      <span
                        className={`meter-fill meter-${status.replace(/\s+/g, "")}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card title="Recent activity" index={5}>
          {isLoading ? <SkeletonLines count={5} /> : <ActivityList entries={activity} />}
        </Card>
      </div>
    </>
  );
}

export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState title="Nothing yet" message="Activity shows up here as people work." />;
  }

  return (
    <ul className="activity-list">
      {entries.map((entry) => (
        <li key={entry.id} className="activity-item">
          <span className={`activity-icon activity-${entry.action.toLowerCase()}`} aria-hidden="true">
            {ACTION_ICONS[entry.action] ?? "•"}
          </span>
          <div className="activity-body">
            <div className="activity-text">
              <strong>{entry.username}</strong> {describe(entry)}
            </div>
            <time className="activity-time" dateTime={entry.created_at}>
              {relativeTime(entry.created_at)}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}

function describe(entry: ActivityEntry) {
  const label =
    (entry.after_state?.title as string | undefined) ??
    (entry.before_state?.title as string | undefined) ??
    (entry.after_state?.name as string | undefined) ??
    null;

  const subject = label ? `"${label}"` : `${entry.entity_type} #${entry.entity_id ?? "?"}`;

  switch (entry.action) {
    case "CREATE":
      return `created ${entry.entity_type} ${subject}`;
    case "UPDATE":
      return `updated ${entry.entity_type} ${subject}`;
    case "DELETE":
      return `deleted ${entry.entity_type} ${subject}`;
    case "LOGIN":
      return "signed in";
    case "REGISTER":
      return "created an account";
    case "CHANGE_PASSWORD":
      return "changed their password";
    default:
      return `${entry.action.toLowerCase()} ${entry.entity_type}`;
  }
}
