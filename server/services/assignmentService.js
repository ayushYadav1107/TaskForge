const db = require("../db/jsonStore");
const { AssignmentError } = require("../utils/errors");
const activityService = require("./activityService");

const STATUSES = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"];

function enrichWithTask(assignment) {
  const task = db.table("tasks").find(assignment.task_id);
  return Object.assign({}, assignment, {
    task_title: task ? task.title : null,
    task_description: task ? task.description : null,
    task_priority: task ? task.priority : null,
    task_estimated_hours: task ? task.estimated_hours : null,
  });
}

function enrichWithEmployee(assignment) {
  const employee = db.table("employees").find(assignment.employee_id);
  return Object.assign({}, assignment, {
    employee_name: employee ? `${employee.first_name} ${employee.last_name}` : null,
    employee_code: employee ? employee.employee_code : null,
  });
}

function assignTaskToEmployee(taskId, employeeId, actorId) {
  const task = db.table("tasks").find(taskId);
  if (!task || task.is_deleted) throw new AssignmentError("Task not found", 404);

  const employee = db.table("employees").find(employeeId);
  if (!employee || !employee.is_active) throw new AssignmentError("Employee not found", 404);

  if (
    db.table("task_assignments").findOne(
      (a) => a.task_id === Number(taskId) && a.employee_id === Number(employeeId)
    )
  ) {
    throw new AssignmentError("This task is already assigned to that employee");
  }

  const now = new Date().toISOString();
  const assignment = db.table("task_assignments").insert({
    task_id: Number(taskId),
    employee_id: Number(employeeId),
    status: "Pending",
    completion_percentage: 0,
    remarks: "",
    assigned_at: now,
    updated_at: now,
  });

  activityService.log(actorId, "CREATE", "assignment", assignment.id, null, assignment);
  return assignment;
}

function updateAssignmentStatus(id, fields, actorId) {
  const existing = db.table("task_assignments").find(id);
  if (!existing) throw new AssignmentError("Assignment not found", 404);

  const patch = { updated_at: new Date().toISOString() };

  if (fields.status !== undefined) {
    if (!STATUSES.includes(fields.status)) {
      throw new AssignmentError(`Status must be one of: ${STATUSES.join(", ")}`);
    }
    patch.status = fields.status;
  }
  if (fields.completion_percentage !== undefined) {
    const pct = Number(fields.completion_percentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      throw new AssignmentError("completion_percentage must be between 0 and 100");
    }
    patch.completion_percentage = pct;
  }
  if (fields.remarks !== undefined) patch.remarks = fields.remarks;

  if (patch.status === "Completed") patch.completion_percentage = 100;

  const updated = db.table("task_assignments").update(id, patch);
  activityService.log(actorId, "UPDATE", "assignment", id, existing, updated);
  return updated;
}

function removeAssignment(id, actorId) {
  const existing = db.table("task_assignments").find(id);
  if (!existing) throw new AssignmentError("Assignment not found", 404);
  db.table("task_assignments").remove(id);
  activityService.log(actorId, "DELETE", "assignment", id, existing, null);
  return true;
}

function getAssignmentsForEmployee(employeeId) {
  return db
    .table("task_assignments")
    .filter((a) => a.employee_id === Number(employeeId))
    .map(enrichWithTask)
    .sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
}

function getAssignmentsForTask(taskId) {
  return db
    .table("task_assignments")
    .filter((a) => a.task_id === Number(taskId))
    .map(enrichWithEmployee);
}

function listAllAssignments() {
  return db
    .table("task_assignments")
    .all()
    .map((a) => enrichWithTask(enrichWithEmployee(a)))
    .sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
}

module.exports = {
  assignTaskToEmployee,
  updateAssignmentStatus,
  removeAssignment,
  getAssignmentsForEmployee,
  getAssignmentsForTask,
  listAllAssignments,
  STATUSES,
};
