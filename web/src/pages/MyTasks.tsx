import { useState, type FormEvent } from "react";

import { ApiError } from "../api/client";
import { useMyAssignments, useUpdateAssignment } from "../api/hooks";
import { STATUSES, type Assignment, type Status } from "../api/types";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { Badge, Card, EmptyState, Field, FormError, ProgressRing, SkeletonLines, StatCard } from "../components/ui";
import { relativeTime } from "../lib/format";

export function MyTasks() {
  const { data: assignments, isLoading } = useMyAssignments();
  const [editing, setEditing] = useState<Assignment | null>(null);

  const items = assignments ?? [];
  const done = items.filter((item) => item.status === "Completed").length;
  const active = items.filter((item) => item.status === "In Progress").length;
  const completion = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.completion_percentage, 0) / items.length)
    : 0;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Assigned to me" value={items.length} icon="☰" index={0} />
        <StatCard label="In progress" value={active} icon="◐" index={1} />
        <StatCard label="Completed" value={done} icon="✓" index={2} />
        <StatCard label="Average progress" value={completion} suffix="%" icon="◉" index={3} />
      </div>

      <Card title="Your progress" index={4}>
        <div className="ring-wrap">
          <ProgressRing percent={completion} />
          <div className="status-breakdown">
            {STATUSES.map((status) => {
              const count = items.filter((item) => item.status === status).length;
              const share = items.length ? Math.round((count / items.length) * 100) : 0;
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
                    aria-label={`${status}: ${count} of ${items.length}`}
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

      <Card title="Assigned tasks" index={5}>
        {isLoading ? (
          <SkeletonLines count={4} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing on your plate"
            message="When a manager assigns you work, it shows up here."
          />
        ) : (
          <div className="task-grid">
            {items.map((assignment) => (
              <article key={assignment.id} className="task-card">
                <h4>{assignment.task_title}</h4>
                {assignment.task_description ? (
                  <p className="cell-sub">{assignment.task_description}</p>
                ) : null}

                <div className="task-card-meta">
                  <Badge value={assignment.task_priority} />
                  <Badge value={assignment.status} />
                  {assignment.task_estimated_hours ? (
                    <span>{assignment.task_estimated_hours}h</span>
                  ) : null}
                </div>

                <div
                  className="meter"
                  role="meter"
                  aria-valuenow={assignment.completion_percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${assignment.completion_percentage}% complete`}
                >
                  <span className="meter-fill" style={{ width: `${assignment.completion_percentage}%` }} />
                </div>

                <footer className="task-card-foot">
                  <time dateTime={assignment.updated_at}>
                    Updated {relativeTime(assignment.updated_at)}
                  </time>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(assignment)}>
                    Update
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </Card>

      <UpdateModal assignment={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function UpdateModal({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) {
  const updateAssignment = useUpdateAssignment();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>("Pending");
  const [openFor, setOpenFor] = useState<number | null>(null);

  // Re-seed the form when a different card is opened.
  if (assignment && openFor !== assignment.id) {
    setOpenFor(assignment.id);
    setProgress(assignment.completion_percentage);
    setStatus(assignment.status);
    setError(null);
  }

  if (!assignment) return null;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const remarks = String(new FormData(event.currentTarget).get("remarks") ?? "");

    updateAssignment.mutate(
      { id: assignment!.id, status, completion_percentage: progress, remarks },
      {
        onSuccess: () => {
          toast(status === "Completed" ? "Nice — task completed!" : "Progress saved", "success");
          onClose();
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : "Could not save that update"),
      },
    );
  }

  return (
    <Modal open title="Update progress" subtitle={assignment.task_title ?? undefined} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormError message={error} />

        <Field label="Status" htmlFor="assignment-status">
          <select
            id="assignment-status"
            value={status}
            onChange={(event) => {
              const next = event.target.value as Status;
              setStatus(next);
              // Marking something done and leaving the bar at 40% is a mismatch
              // the server corrects anyway — show it straight away instead.
              if (next === "Completed") setProgress(100);
            }}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Completion — ${progress}%`} htmlFor="assignment-progress">
          <div className="progress-input-row">
            <input
              id="assignment-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
            />
            <span className="progress-value">{progress}%</span>
          </div>
        </Field>

        <Field label="Remarks" htmlFor="assignment-remarks">
          <textarea
            id="assignment-remarks"
            name="remarks"
            defaultValue={assignment.remarks ?? ""}
            placeholder="Notes for your manager…"
          />
        </Field>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={updateAssignment.isPending}>
            {updateAssignment.isPending ? "Saving…" : "Save update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
