const bcrypt = require("bcryptjs");
const db = require("../db/jsonStore");
const { EmployeeError } = require("../utils/errors");
const activityService = require("./activityService");

const REQUIRED_FIELDS = [
  "department_id",
  "employee_code",
  "first_name",
  "last_name",
  "email",
  "phone",
];

function enrich(employee) {
  if (!employee) return null;
  const department = db.table("departments").find(employee.department_id);
  const user = db.table("users").find(employee.user_id);
  return Object.assign({}, employee, {
    department_name: department ? department.name : null,
    username: user ? user.username : null,
  });
}

function createEmployee(fields, actorId) {
  const missing = REQUIRED_FIELDS.filter((f) => !fields[f]);
  if (missing.length) {
    throw new EmployeeError(`${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required`);
  }

  if (!db.table("departments").find(fields.department_id)) {
    throw new EmployeeError("department_id does not exist");
  }
  if (db.table("employees").findOne((e) => e.employee_code === fields.employee_code)) {
    throw new EmployeeError("employee_code already in use");
  }
  if (db.table("employees").findOne((e) => e.email === fields.email)) {
    throw new EmployeeError("email already in use");
  }

  let userId = fields.user_id ? Number(fields.user_id) : null;

  if (userId) {
    if (!db.table("users").find(userId)) throw new EmployeeError("user_id does not exist");
    if (db.table("employees").findOne((e) => e.user_id === userId)) {
      throw new EmployeeError("This user already has an employee profile");
    }
  } else {
    if (!fields.username || !fields.password) {
      throw new EmployeeError("username and password are required to create the employee's login");
    }
    if (fields.password.length < 6) {
      throw new EmployeeError("Password must be at least 6 characters");
    }
    if (db.table("users").findOne((u) => u.username === fields.username)) {
      throw new EmployeeError("That username is already taken");
    }
    const user = db.table("users").insert({
      username: fields.username,
      password_hash: bcrypt.hashSync(fields.password, 10),
      role: fields.role === "manager" ? "manager" : "employee",
      is_active: true,
      created_at: new Date().toISOString(),
    });
    userId = user.id;
  }

  const employee = db.table("employees").insert({
    user_id: userId,
    department_id: Number(fields.department_id),
    employee_code: fields.employee_code,
    first_name: fields.first_name,
    last_name: fields.last_name,
    email: fields.email,
    phone: fields.phone,
    position: fields.position || fields.job_title || "",
    hire_date: fields.hire_date || new Date().toISOString().slice(0, 10),
    is_active: true,
    created_at: new Date().toISOString(),
  });

  activityService.log(actorId, "CREATE", "employee", employee.id, null, employee);
  return enrich(employee);
}

function getEmployee(id) {
  const employee = db.table("employees").find(id);
  if (!employee) throw new EmployeeError("Employee not found", 404);
  return enrich(employee);
}

function updateEmployee(id, fields, actorId) {
  const existing = db.table("employees").find(id);
  if (!existing) throw new EmployeeError("Employee not found", 404);

  const patch = Object.assign({}, fields);
  if (patch.job_title && !patch.position) {
    patch.position = patch.job_title;
  }
  delete patch.job_title;
  delete patch.id;
  delete patch.user_id;

  if (patch.department_id && !db.table("departments").find(patch.department_id)) {
    throw new EmployeeError("department_id does not exist");
  }

  const updated = db.table("employees").update(id, patch);
  activityService.log(actorId, "UPDATE", "employee", id, existing, updated);
  return enrich(updated);
}

function deleteEmployee(id, actorId) {
  const existing = db.table("employees").find(id);
  if (!existing) throw new EmployeeError("Employee not found", 404);

  db.table("employees").update(id, { is_active: false });
  db.table("users").update(existing.user_id, { is_active: false });
  activityService.log(actorId, "DELETE", "employee", id, existing, null);
  return true;
}

function listEmployeesByDepartment(departmentId) {
  return db
    .table("employees")
    .filter((e) => e.department_id === Number(departmentId) && e.is_active)
    .map(enrich);
}

function listEmployees() {
  return db
    .table("employees")
    .filter((e) => e.is_active)
    .map(enrich);
}

function listDepartments() {
  return db.table("departments").all();
}

function createDepartment(fields, actorId) {
  if (!fields.name || !fields.name.trim()) throw new EmployeeError("Department name is required");
  if (db.table("departments").findOne((d) => d.name.toLowerCase() === fields.name.trim().toLowerCase())) {
    throw new EmployeeError("A department with that name already exists");
  }
  const department = db.table("departments").insert({
    name: fields.name.trim(),
    description: fields.description || "",
  });
  activityService.log(actorId, "CREATE", "department", department.id, null, department);
  return department;
}

module.exports = {
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  listEmployeesByDepartment,
  listEmployees,
  listDepartments,
  createDepartment,
};
