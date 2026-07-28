const db = require("../db/jsonStore");
const { TaskError } = require("../utils/errors");
const activityService = require("./activityService");

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const UPDATABLE_FIELDS = ["title", "description", "notes", "priority", "estimated_hours"];

function createTask(fields, createdBy) {
  const { title, description, notes, priority, estimated_hours } = fields;
  if (!title || !title.trim()) throw new TaskError("Title is required");
  if (priority && !PRIORITIES.includes(priority)) {
    throw new TaskError(`Priority must be one of: ${PRIORITIES.join(", ")}`);
  }
  if (estimated_hours !== undefined && estimated_hours !== null && Number(estimated_hours) <= 0) {
    throw new TaskError("Estimated hours must be a positive number");
  }

  const now = new Date().toISOString();
  const task = db.table("tasks").insert({
    title: title.trim(),
    description: description || "",
    notes: notes || "",
    priority: priority || "Medium",
    estimated_hours: estimated_hours ? Number(estimated_hours) : null,
    created_by: createdBy,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  });

  activityService.log(createdBy, "CREATE", "task", task.id, null, task);
  return task;
}

function getTask(id) {
  const task = db.table("tasks").find(id);
  if (!task || task.is_deleted) throw new TaskError("Task not found", 404);
  return task;
}

function updateTask(id, fields, actorId) {
  const existing = getTask(id);
  const patch = {};
  for (const key of UPDATABLE_FIELDS) {
    if (fields[key] !== undefined) patch[key] = fields[key];
  }
  if (patch.priority && !PRIORITIES.includes(patch.priority)) {
    throw new TaskError(`Priority must be one of: ${PRIORITIES.join(", ")}`);
  }
  if (patch.estimated_hours !== undefined && patch.estimated_hours !== null && Number(patch.estimated_hours) <= 0) {
    throw new TaskError("Estimated hours must be a positive number");
  }
  patch.updated_at = new Date().toISOString();

  const updated = db.table("tasks").update(id, patch);
  activityService.log(actorId, "UPDATE", "task", id, existing, updated);
  return updated;
}

function deleteTask(id, actorId) {
  const existing = getTask(id);
  db.table("tasks").update(id, { is_deleted: true, updated_at: new Date().toISOString() });
  db.table("task_assignments").removeWhere((a) => a.task_id === Number(id));
  activityService.log(actorId, "DELETE", "task", id, existing, null);
  return true;
}

function listTasks(filters = {}) {
  let tasks = db.table("tasks").filter((t) => !t.is_deleted);

  if (filters.priority) tasks = tasks.filter((t) => t.priority === filters.priority);
  if (filters.created_by) tasks = tasks.filter((t) => t.created_by === Number(filters.created_by));

  if (filters.status) {
    const matchingTaskIds = new Set(
      db
        .table("task_assignments")
        .filter((a) => a.status === filters.status)
        .map((a) => a.task_id)
    );
    tasks = tasks.filter((t) => matchingTaskIds.has(t.id));
  }

  return tasks
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((task) => {
      const assignments = db.table("task_assignments").filter((a) => a.task_id === task.id);
      return Object.assign({}, task, { assignment_count: assignments.length });
    });
}

module.exports = { createTask, getTask, updateTask, deleteTask, listTasks, PRIORITIES };
