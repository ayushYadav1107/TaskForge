const STATUSES = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"];

const state = {
  user: null,
  tasks: [],
  employees: [],
  departments: [],
  assignments: [],
  priorityFilter: "",
  view: "kanban",
};

const PAGE_META = {
  overview: ["Overview", "Welcome back — here's what's happening."],
  tasks: ["Tasks", "Create, assign, and track work across your team."],
  employees: ["Employees", "Manage employee profiles and departments."],
  departments: ["Departments", "Organize your team into departments."],
  activity: ["Activity Log", "A full audit trail of what changed and when."],
};

function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
});
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });
});

function employeeName(id) {
  const e = state.employees.find((emp) => emp.id === id);
  return e ? `${e.first_name} ${e.last_name}` : "Unknown";
}

// ---------------- Data loading ----------------

async function refreshData() {
  const [tasksRes, employeesRes, deptRes, assignRes] = await Promise.all([
    Api.get("/api/tasks"),
    Api.get("/api/employees"),
    Api.get("/api/departments"),
    Api.get("/api/assignments"),
  ]);
  state.tasks = tasksRes.tasks;
  state.employees = employeesRes.employees;
  state.departments = deptRes.departments;
  state.assignments = assignRes.assignments;
}

// ---------------- Overview ----------------

async function renderOverview() {
  const { stats, recent_activity } = await Api.get("/api/dashboard/stats");

  document.getElementById("stat-grid").innerHTML = `
    <div class="stat-card"><div class="stat-label">Total tasks</div><div class="stat-value">${stats.total_tasks}</div></div>
    <div class="stat-card"><div class="stat-label">Employees</div><div class="stat-value">${stats.total_employees}</div></div>
    <div class="stat-card"><div class="stat-label">Departments</div><div class="stat-value">${stats.total_departments}</div></div>
    <div class="stat-card"><div class="stat-label">Assignments</div><div class="stat-value">${stats.total_assignments}</div></div>
    <div class="stat-card"><div class="stat-label">Completion rate</div><div class="stat-value accent">${stats.completion_rate}%</div></div>
  `;

  const max = Math.max(1, ...Object.values(stats.by_status));
  document.getElementById("status-breakdown").innerHTML = Object.entries(stats.by_status)
    .map(
      ([status, count]) => `
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
          <span><span class="badge ${badgeClass(status)}">${status}</span></span>
          <span class="text-muted">${count}</span>
        </div>
        <div style="height:8px; background:var(--border); border-radius:999px; overflow:hidden;">
          <span style="display:block; height:100%; width:${(count / max) * 100}%; background:var(--primary);"></span>
        </div>
      </div>`
    )
    .join("");

  renderActivityList(document.getElementById("overview-activity"), recent_activity);
}

const ACTION_VERBS = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  LOGIN: "logged into",
  CHANGE_PASSWORD: "changed the password for",
  SEED: "seeded",
};

function renderActivityList(container, items) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🗒️</div>No activity yet.</div>`;
    return;
  }
  container.innerHTML = items
    .map((item) => {
      const when = new Date(item.created_at).toLocaleString();
      const verb = ACTION_VERBS[item.action] || item.action.toLowerCase();
      return `
      <div class="activity-item">
        <div class="dot"></div>
        <div>
          <div><strong>${escapeHtml(item.username)}</strong> ${verb} a ${item.entity_type}${item.entity_id ? ` #${item.entity_id}` : ""}</div>
          <div class="meta-time">${when}</div>
        </div>
      </div>`;
    })
    .join("");
}

// ---------------- Tasks ----------------

function setTaskView(view) {
  state.view = view;
  document.getElementById("view-kanban-btn").classList.toggle("active", view === "kanban");
  document.getElementById("view-table-btn").classList.toggle("active", view === "table");
  document.getElementById("tasks-kanban-view").style.display = view === "kanban" ? "block" : "none";
  document.getElementById("tasks-table-view").style.display = view === "table" ? "block" : "none";
}

function filteredTasks() {
  if (!state.priorityFilter) return state.tasks;
  return state.tasks.filter((t) => t.priority === state.priorityFilter);
}

function renderTasksKanban() {
  const tasks = filteredTasks();
  const taskIds = new Set(tasks.map((t) => t.id));
  const assignments = state.assignments.filter((a) => taskIds.has(a.task_id));
  const unassigned = tasks.filter((t) => !state.assignments.some((a) => a.task_id === t.id));

  const columns = STATUSES.map((status) => {
    const items = assignments.filter((a) => a.status === status);
    const cards = items
      .map(
        (a) => `
        <div class="task-card" data-open-assignment="${a.id}">
          <div class="title">${escapeHtml(a.task_title)}</div>
          <div class="meta">
            <span>${escapeHtml(employeeName(a.employee_id))}</span>
            <span class="badge ${badgeClass(a.task_priority)}">${a.task_priority}</span>
          </div>
          <div class="progress-bar"><span style="width:${a.completion_percentage}%"></span></div>
        </div>`
      )
      .join("");
    return `
      <div class="kanban-col">
        <h3>${status} <span class="count">${items.length}</span></h3>
        ${cards || `<div class="text-muted" style="font-size:12.5px;">No tasks</div>`}
      </div>`;
  });

  const unassignedCards = unassigned
    .map(
      (t) => `
      <div class="task-card" data-open-assign="${t.id}">
        <div class="title">${escapeHtml(t.title)}</div>
        <div class="meta">
          <span class="text-muted">Unassigned</span>
          <span class="badge ${badgeClass(t.priority)}">${t.priority}</span>
        </div>
      </div>`
    )
    .join("");

  columns.unshift(`
    <div class="kanban-col">
      <h3>Unassigned <span class="count">${unassigned.length}</span></h3>
      ${unassignedCards || `<div class="text-muted" style="font-size:12.5px;">Everything is assigned 🎉</div>`}
    </div>`);

  document.getElementById("tasks-kanban").innerHTML = columns.join("");

  document.querySelectorAll("[data-open-assignment]").forEach((el) => {
    el.addEventListener("click", () => openAssignmentModal(Number(el.dataset.openAssignment)));
  });
  document.querySelectorAll("[data-open-assign]").forEach((el) => {
    el.addEventListener("click", () => openAssignModal(Number(el.dataset.openAssign)));
  });
}

function renderTasksTable() {
  const tasks = filteredTasks();
  document.getElementById("tasks-table-body").innerHTML = tasks
    .map((t) => {
      const count = state.assignments.filter((a) => a.task_id === t.id).length;
      return `
      <tr>
        <td class="wrap"><strong>${escapeHtml(t.title)}</strong><br /><span class="text-muted" style="font-size:12px;">${escapeHtml(t.description || "")}</span></td>
        <td><span class="badge ${badgeClass(t.priority)}">${t.priority}</span></td>
        <td>${t.estimated_hours || "—"}</td>
        <td>${count} assigned</td>
        <td style="display:flex; gap:6px;">
          <button class="btn btn-ghost btn-sm" data-assign="${t.id}">Assign</button>
          <button class="btn btn-ghost btn-sm" data-edit-task="${t.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete-task="${t.id}">Delete</button>
        </td>
      </tr>`;
    })
    .join("");

  document.querySelectorAll("[data-assign]").forEach((el) => {
    el.addEventListener("click", () => openAssignModal(Number(el.dataset.assign)));
  });
  document.querySelectorAll("[data-edit-task]").forEach((el) => {
    el.addEventListener("click", () => openTaskModal(Number(el.dataset.editTask)));
  });
  document.querySelectorAll("[data-delete-task]").forEach((el) => {
    el.addEventListener("click", () => deleteTask(Number(el.dataset.deleteTask)));
  });
}

function renderTasks() {
  renderTasksKanban();
  renderTasksTable();
}

function openTaskModal(taskId) {
  const form = document.getElementById("task-form");
  form.reset();
  document.getElementById("task-id").value = "";
  document.getElementById("task-modal-title").textContent = "New task";

  if (taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    document.getElementById("task-modal-title").textContent = "Edit task";
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-hours").value = task.estimated_hours || "";
    document.getElementById("task-notes").value = task.notes || "";
  }
  openModal("task-modal");
}

document.getElementById("new-task-btn").addEventListener("click", () => openTaskModal(null));

document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("task-id").value;
  const payload = {
    title: document.getElementById("task-title").value.trim(),
    description: document.getElementById("task-description").value.trim(),
    priority: document.getElementById("task-priority").value,
    estimated_hours: document.getElementById("task-hours").value || null,
    notes: document.getElementById("task-notes").value.trim(),
  };
  try {
    if (id) {
      await Api.put(`/api/tasks/${id}`, payload);
      toast("Task updated", "success");
    } else {
      await Api.post("/api/tasks", payload);
      toast("Task created", "success");
    }
    closeModal("task-modal");
    await refreshData();
    renderTasks();
  } catch (err) {
    toast(err.message, "error");
  }
});

async function deleteTask(id) {
  if (!confirm("Delete this task and all its assignments?")) return;
  try {
    await Api.del(`/api/tasks/${id}`);
    toast("Task deleted", "success");
    await refreshData();
    renderTasks();
  } catch (err) {
    toast(err.message, "error");
  }
}

function openAssignModal(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  document.getElementById("assign-task-id").value = taskId;
  document.getElementById("assign-modal-sub").textContent = `Assigning "${task ? task.title : ""}"`;
  const select = document.getElementById("assign-employee");
  select.innerHTML = state.employees
    .map((e) => `<option value="${e.id}">${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)} — ${escapeHtml(e.department_name || "")}</option>`)
    .join("");
  openModal("assign-modal");
}

document.getElementById("assign-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const task_id = document.getElementById("assign-task-id").value;
  const employee_id = document.getElementById("assign-employee").value;
  try {
    await Api.post("/api/assignments", { task_id, employee_id });
    toast("Task assigned", "success");
    closeModal("assign-modal");
    await refreshData();
    renderTasks();
  } catch (err) {
    toast(err.message, "error");
  }
});

function openAssignmentModal(assignmentId) {
  const a = state.assignments.find((x) => x.id === assignmentId);
  if (!a) return;
  document.getElementById("assignment-id").value = a.id;
  document.getElementById("assignment-modal-title").textContent = a.task_title;
  document.getElementById("assignment-modal-sub").textContent = `Assigned to ${employeeName(a.employee_id)}`;
  document.getElementById("assignment-status").value = a.status;
  document.getElementById("assignment-progress").value = a.completion_percentage;
  document.getElementById("assignment-progress-value").textContent = `${a.completion_percentage}%`;
  document.getElementById("assignment-remarks").value = a.remarks || "";
  openModal("assignment-modal");
}

document.getElementById("assignment-progress").addEventListener("input", (e) => {
  document.getElementById("assignment-progress-value").textContent = `${e.target.value}%`;
});

document.getElementById("assignment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("assignment-id").value;
  const payload = {
    status: document.getElementById("assignment-status").value,
    completion_percentage: Number(document.getElementById("assignment-progress").value),
    remarks: document.getElementById("assignment-remarks").value,
  };
  try {
    await Api.put(`/api/assignments/${id}/status`, payload);
    toast("Assignment updated", "success");
    closeModal("assignment-modal");
    await refreshData();
    renderTasks();
    renderOverview();
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("unassign-btn").addEventListener("click", async () => {
  const id = document.getElementById("assignment-id").value;
  if (!confirm("Remove this assignment?")) return;
  try {
    await Api.del(`/api/assignments/${id}`);
    toast("Assignment removed", "success");
    closeModal("assignment-modal");
    await refreshData();
    renderTasks();
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("priority-filter").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  document.querySelectorAll("#priority-filter button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  state.priorityFilter = btn.dataset.priority;
  renderTasks();
});

document.getElementById("view-kanban-btn").addEventListener("click", () => setTaskView("kanban"));
document.getElementById("view-table-btn").addEventListener("click", () => setTaskView("table"));

// ---------------- Employees ----------------

function renderEmployees() {
  document.getElementById("employees-table-body").innerHTML = state.employees
    .map(
      (e) => `
      <tr>
        <td><div style="display:flex; align-items:center; gap:10px;"><div class="avatar" style="width:30px; height:30px; font-size:11px;">${initials(e.first_name, e.last_name)}</div>${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)}</div></td>
        <td>${escapeHtml(e.employee_code)}</td>
        <td>${escapeHtml(e.department_name || "—")}</td>
        <td>${escapeHtml(e.position || "—")}</td>
        <td>${escapeHtml(e.email)}<br /><span class="text-muted" style="font-size:12px;">${escapeHtml(e.phone)}</span></td>
        <td style="display:flex; gap:6px;">
          <button class="btn btn-ghost btn-sm" data-edit-employee="${e.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete-employee="${e.id}">Remove</button>
        </td>
      </tr>`
    )
    .join("");

  document.querySelectorAll("[data-edit-employee]").forEach((el) => {
    el.addEventListener("click", () => openEmployeeModal(Number(el.dataset.editEmployee)));
  });
  document.querySelectorAll("[data-delete-employee]").forEach((el) => {
    el.addEventListener("click", () => deleteEmployee(Number(el.dataset.deleteEmployee)));
  });
}

function fillDepartmentSelect(select, selectedId) {
  select.innerHTML = state.departments
    .map((d) => `<option value="${d.id}" ${d.id === selectedId ? "selected" : ""}>${escapeHtml(d.name)}</option>`)
    .join("");
}

function openEmployeeModal(employeeId) {
  const form = document.getElementById("employee-form");
  form.reset();
  document.getElementById("employee-id").value = "";
  document.getElementById("employee-modal-title").textContent = "New employee";
  fillDepartmentSelect(document.getElementById("employee-department"));
  document.getElementById("employee-login-fields").style.display = "block";

  if (employeeId) {
    const emp = state.employees.find((e) => e.id === employeeId);
    document.getElementById("employee-modal-title").textContent = "Edit employee";
    document.getElementById("employee-id").value = emp.id;
    document.getElementById("employee-first").value = emp.first_name;
    document.getElementById("employee-last").value = emp.last_name;
    document.getElementById("employee-code").value = emp.employee_code;
    document.getElementById("employee-email").value = emp.email;
    document.getElementById("employee-phone").value = emp.phone;
    document.getElementById("employee-position").value = emp.position || "";
    fillDepartmentSelect(document.getElementById("employee-department"), emp.department_id);
    document.getElementById("employee-login-fields").style.display = "none";
  }
  openModal("employee-modal");
}

document.getElementById("new-employee-btn").addEventListener("click", () => openEmployeeModal(null));

document.getElementById("employee-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("employee-id").value;
  const payload = {
    first_name: document.getElementById("employee-first").value.trim(),
    last_name: document.getElementById("employee-last").value.trim(),
    employee_code: document.getElementById("employee-code").value.trim(),
    department_id: document.getElementById("employee-department").value,
    email: document.getElementById("employee-email").value.trim(),
    phone: document.getElementById("employee-phone").value.trim(),
    position: document.getElementById("employee-position").value.trim(),
  };
  if (!id) {
    payload.username = document.getElementById("employee-username").value.trim();
    payload.password = document.getElementById("employee-password").value;
  }
  try {
    if (id) {
      await Api.put(`/api/employees/${id}`, payload);
      toast("Employee updated", "success");
    } else {
      await Api.post("/api/employees", payload);
      toast("Employee created", "success");
    }
    closeModal("employee-modal");
    await refreshData();
    renderEmployees();
  } catch (err) {
    toast(err.message, "error");
  }
});

async function deleteEmployee(id) {
  if (!confirm("Remove this employee? Their login will be deactivated.")) return;
  try {
    await Api.del(`/api/employees/${id}`);
    toast("Employee removed", "success");
    await refreshData();
    renderEmployees();
  } catch (err) {
    toast(err.message, "error");
  }
}

// ---------------- Departments ----------------

function renderDepartments() {
  document.getElementById("departments-grid").innerHTML = state.departments
    .map((d) => {
      const count = state.employees.filter((e) => e.department_id === d.id).length;
      return `
      <div class="stat-card">
        <div class="stat-label">${escapeHtml(d.name)}</div>
        <div class="stat-value">${count}</div>
        <div class="text-muted" style="font-size:12.5px; margin-top:4px;">${escapeHtml(d.description || "employees")}</div>
      </div>`;
    })
    .join("");
}

document.getElementById("new-department-btn").addEventListener("click", () => openModal("department-modal"));

document.getElementById("department-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("department-name").value.trim(),
    description: document.getElementById("department-description").value.trim(),
  };
  try {
    await Api.post("/api/departments", payload);
    toast("Department created", "success");
    closeModal("department-modal");
    document.getElementById("department-form").reset();
    await refreshData();
    renderDepartments();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ---------------- Activity ----------------

async function renderActivity() {
  const { activity } = await Api.get("/api/dashboard/activity?limit=150");
  renderActivityList(document.getElementById("activity-log"), activity);
}

// ---------------- Navigation ----------------

async function showSection(name) {
  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === name);
  });
  document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
  document.getElementById(`section-${name}`).classList.add("active");
  document.getElementById("page-title").textContent = PAGE_META[name][0];
  document.getElementById("page-sub").textContent = PAGE_META[name][1];

  await refreshData();
  if (name === "overview") await renderOverview();
  if (name === "tasks") renderTasks();
  if (name === "employees") renderEmployees();
  if (name === "departments") renderDepartments();
  if (name === "activity") await renderActivity();
}

document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});

// ---------------- Password / theme / logout ----------------

document.getElementById("change-password-btn").addEventListener("click", () => openModal("password-modal"));

document.getElementById("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.post("/api/auth/change-password", {
      oldPassword: document.getElementById("old-password").value,
      newPassword: document.getElementById("new-password").value,
    });
    toast("Password updated", "success");
    document.getElementById("password-form").reset();
    closeModal("password-modal");
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("logout-btn").addEventListener("click", logout);

document.getElementById("theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("taskforge-theme", next);
});

(function initTheme() {
  const saved = localStorage.getItem("taskforge-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
})();

// ---------------- Boot ----------------

(async function init() {
  const user = await guardPage(["admin", "manager"]);
  if (!user) return;
  state.user = user;
  document.getElementById("user-avatar").textContent = initials(user.username, "");
  document.getElementById("user-avatar").title = `${user.username} (${user.role})`;
  setTaskView("kanban");
  await showSection("overview");
})();
