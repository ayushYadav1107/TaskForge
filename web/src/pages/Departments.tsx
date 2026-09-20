import { useState, type FormEvent } from "react";

import { ApiError } from "../api/client";
import { useCreateDepartment, useDepartments, useEmployees } from "../api/hooks";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { Card, EmptyState, Field, FormError, SkeletonLines } from "../components/ui";
import { pluralise } from "../lib/format";

const ICONS = ["◆", "▲", "●", "■", "★", "▼"];

export function Departments() {
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees();
  const [adding, setAdding] = useState(false);

  const headcount = new Map<number, number>();
  for (const employee of employees ?? []) {
    headcount.set(employee.department_id, (headcount.get(employee.department_id) ?? 0) + 1);
  }

  return (
    <>
      <Card
        title="Departments"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            New department
          </button>
        }
      >
        {isLoading ? (
          <SkeletonLines count={3} />
        ) : (departments ?? []).length === 0 ? (
          <EmptyState title="No departments yet" message="Create one to start grouping your team." />
        ) : (
          <div className="dept-grid">
            {(departments ?? []).map((department, index) => (
              <article key={department.id} className="dept-card animate-in" style={{ ["--i" as string]: index }}>
                <span className="dept-icon" aria-hidden="true">
                  {ICONS[index % ICONS.length]}
                </span>
                <h3>{department.name}</h3>
                <p>{department.description || "No description."}</p>
                <div className="dept-count">{pluralise(headcount.get(department.id) ?? 0, "person", "people")}</div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <DepartmentModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function DepartmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createDepartment = useCreateDepartment();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    createDepartment.mutate(
      {
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
      },
      {
        onSuccess: () => {
          toast("Department created", "success");
          onClose();
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : "Could not create it"),
      },
    );
  }

  if (!open) return null;

  return (
    <Modal open title="New department" onClose={onClose} width={420}>
      <form onSubmit={onSubmit}>
        <FormError message={error} />

        <Field label="Name" htmlFor="dept-name">
          <input id="dept-name" name="name" required autoFocus />
        </Field>

        <Field label="Description" htmlFor="dept-description">
          <textarea id="dept-description" name="description" />
        </Field>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={createDepartment.isPending}>
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
