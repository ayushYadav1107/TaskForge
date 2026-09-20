import { useMemo, useState, type DragEvent, type FormEvent } from "react";

import { ApiError } from "../api/client";
import {
  useAssignTask,
  useAssignments,
  useDeleteTask,
  useEmployees,
  useRemoveAssignment,
  useSaveTask,
  useTasks,
  useUpdateAssignment,
} from "../api/hooks";
import { PRIORITIES, STATUSES, type Assignment, type Priority, type Status, type Task } from "../api/types";
import { useConfirm } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { Badge, Card, EmptyState, Field, FormError, SkeletonLines } from "../components/ui";
import { pluralise, relativeTime } from "../lib/format";

type View = "board" | "list";

export function Tasks() {
  const [view, setView] = useState<View>("board");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Task> | null>(null);
  const [assigningTo, setAssigningTo] = useState<Task | null>(null);

  const tasks = useTasks({ priority, search });
  const assignments = useAssignments();

  return (
    <>
      <Card
        actions={
          <div className="toolbar">
            <div className="segmented" role="tablist" aria-label="Task view">
              <button
                type="button"
                role="tab"
                aria-selected={view === "board"}
                className={view === "board" ? "active" : ""}
                onClick={() => setView("board")}
              >
                Board
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "list"}
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
              >
                List
              </button>
            </div>

            <input
              type="search"
              className="toolbar-search"
              placeholder="Search tasks…"
              aria-label="Search tasks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="toolbar-select"
              aria-label="Filter by priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
              New task
            </button>
          </div>
        }
        title="Backlog"
      >
        {tasks.isLoading || assignments.isLoading ? (
          <SkeletonLines count={5} />
        ) : view === "board" ? (
          <Board assignments={assignments.data ?? []} />
        ) : (
          <TaskTable
            tasks={tasks.data ?? []}
            onEdit={setEditing}
            onAssign={setAssigningTo}
          />
        )}
      </Card>

      <TaskModal task={editing} onClose={() => setEditing(null)} />
      <AssignModal task={assigningTo} onClose={() => setAssigningTo(null)} />
    </>
  );
}

/* --------------------------------- Board ---------------------------------- */

function Board({ assignments }: { assignments: Assignment[] }) {
  const updateAssignment = useUpdateAssignment();
  const toast = useToast();
  const [dragOver, setDragOver] = useState<Status | null>(null);

  const columns = useMemo(() => {
    const grouped = new Map<Status, Assignment[]>(STATUSES.map((status) => [status, []]));
    for (const assignment of assignments) grouped.get(assignment.status)?.push(assignment);
    return grouped;
  }, [assignments]);

  function onDrop(event: DragEvent, status: Status) {
    event.preventDefault();
    setDragOver(null);

    const id = Number(event.dataTransfer.getData("text/plain"));
    const assignment = assignments.find((item) => item.id === id);
    if (!assignment || assignment.status === status) return;

    updateAssignment.mutate(
      { id, status },
      {
        onSuccess: () => toast(`Moved to ${status}`, "success"),
        onError: (error) =>
          toast(error instanceof ApiError ? error.message : "Could not move that card", "error"),
      },
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="Nothing assigned yet"
        message="Create a task, then assign it to someone to see it on the board."
      />
    );
  }

  return (
    <div className="kanban">
      {STATUSES.map((status) => {
        const items = columns.get(status) ?? [];
        return (
          <div
            key={status}
            className={`kanban-col${dragOver === status ? " drag-over" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((current) => (current === status ? null : current))}
            onDrop={(event) => onDrop(event, status)}
          >
            <div className="kanban-head">
              <span className={`badge ${`badge-${status.replace(/\s+/g, "")}`}`}>{status}</span>
              <span className="kanban-count">{items.length}</span>
            </div>

            {items.map((assignment) => (
              <article
                key={assignment.id}
                className="task-card"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", String(assignment.id))}
              >
                <h4>{assignment.task_title}</h4>
                <div className="task-card-meta">
                  <Badge value={assignment.task_priority} />
                  <span>{assignment.employee_name}</span>
                </div>
                <div
                  className="meter"
                  role="meter"
                  aria-valuenow={assignment.completion_percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${assignment.task_title}: ${assignment.completion_percentage}% complete`}
                >
                  <span className="meter-fill" style={{ width: `${assignment.completion_percentage}%` }} />
                </div>
              </article>
            ))}

            {items.length === 0 ? <p className="kanban-empty">Drop a card here</p> : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Task table -------------------------------- */

function TaskTable({
  tasks,
  onEdit,
  onAssign,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAssign: (task: Task) => void;
}) {
  const deleteTask = useDeleteTask();
  const confirm = useConfirm();
  const toast = useToast();

  async function remove(task: Task) {
    const confirmed = await confirm({
      title: "Delete this task?",
      message: `"${task.title}" and its assignments will be removed from the board.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    deleteTask.mutate(task.id, {
      onSuccess: () => toast("Task deleted", "success"),
      onError: (error) =>
        toast(error instanceof ApiError ? error.message : "Could not delete that task", "error"),
    });
  }

  if (tasks.length === 0) {
    return <EmptyState title="No tasks match" message="Try clearing the search or the priority filter." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">Priority</th>
            <th scope="col">Estimate</th>
            <th scope="col">Assigned</th>
            <th scope="col">Updated</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <div className="cell-title">{task.title}</div>
                {task.description ? <div className="cell-sub">{task.description}</div> : null}
              </td>
              <td>
                <Badge value={task.priority} />
              </td>
              <td>{task.estimated_hours ? `${task.estimated_hours}h` : "—"}</td>
              <td>{pluralise(task.assignment_count ?? 0, "person", "people")}</td>
              <td>{relativeTime(task.updated_at)}</td>
              <td className="row-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAssign(task)}>
                  Assign
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => remove(task)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------- Task modal -------------------------------- */

function TaskModal({ task, onClose }: { task: Partial<Task> | null; onClose: () => void }) {
  const saveTask = useSaveTask();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const estimate = String(form.get("estimated_hours") ?? "").trim();

    saveTask.mutate(
      {
        id: task!.id,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? ""),
        notes: String(form.get("notes") ?? ""),
        priority: form.get("priority") as Priority,
        estimated_hours: estimate === "" ? null : Number(estimate),
      },
      {
        onSuccess: () => {
          toast(task!.id ? "Task updated" : "Task created", "success");
          onClose();
        },
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : "Could not save that task"),
      },
    );
  }

  return (
    <Modal open title={task.id ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormError message={error} />

        <Field label="Title" htmlFor="task-title">
          <input id="task-title" name="title" defaultValue={task.title ?? ""} required autoFocus />
        </Field>

        <Field label="Description" htmlFor="task-description">
          <textarea id="task-description" name="description" defaultValue={task.description ?? ""} />
        </Field>

        <div className="form-row">
          <Field label="Priority" htmlFor="task-priority">
            <select id="task-priority" name="priority" defaultValue={task.priority ?? "Medium"}>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estimated hours" htmlFor="task-hours" hint="Optional.">
            <input
              id="task-hours"
              name="estimated_hours"
              type="number"
              min="0.5"
              step="0.5"
              defaultValue={task.estimated_hours ?? ""}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="task-notes">
          <textarea id="task-notes" name="notes" defaultValue={task.notes ?? ""} />
        </Field>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saveTask.isPending}>
            {saveTask.isPending ? "Saving…" : "Save task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------ Assign modal ------------------------------- */

function AssignModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const employees = useEmployees(task !== null);
  const assignments = useAssignments();
  const assignTask = useAssignTask();
  const removeAssignment = useRemoveAssignment();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const current = (assignments.data ?? []).filter((item) => item.task_id === task.id);
  const assignedIds = new Set(current.map((item) => item.employee_id));
  const available = (employees.data ?? []).filter((employee) => !assignedIds.has(employee.id));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const employeeId = Number(new FormData(event.currentTarget).get("employee_id"));
    if (!employeeId) {
      setError("Pick someone to assign this to.");
      return;
    }

    assignTask.mutate(
      { task_id: task!.id, employee_id: employeeId },
      {
        onSuccess: () => toast("Task assigned", "success"),
        onError: (err) => setError(err instanceof ApiError ? err.message : "Could not assign that task"),
      },
    );
  }

  return (
    <Modal open title="Assign task" subtitle={task.title} onClose={onClose}>
      <FormError message={error} />

      {current.length > 0 ? (
        <ul className="assignee-list">
          {current.map((assignment) => (
            <li key={assignment.id}>
              <div>
                <div className="cell-title">{assignment.employee_name}</div>
                <div className="cell-sub">
                  {assignment.status} · {assignment.completion_percentage}%
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  removeAssignment.mutate(assignment.id, {
                    onSuccess: () => toast("Assignment removed", "success"),
                  })
                }
                aria-label={`Unassign ${assignment.employee_name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="modal-sub">Nobody is working on this yet.</p>
      )}

      <form onSubmit={onSubmit}>
        <Field label="Add an assignee" htmlFor="assignee">
          <select id="assignee" name="employee_id" defaultValue="">
            <option value="">Choose someone…</option>
            {available.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name} — {employee.department_name}
              </option>
            ))}
          </select>
        </Field>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Done
          </button>
          <button type="submit" className="btn btn-primary" disabled={assignTask.isPending}>
            Assign
          </button>
        </div>
      </form>
    </Modal>
  );
}
