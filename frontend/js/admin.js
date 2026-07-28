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
  tasks: ["Tasks", "Create, assign and track work across your team."],
  employees: ["Employees", "Manage employee profiles and access levels."],
  departments: ["Departments", "Organise your team into departments."],
  activity: ["Activity Log", "A full audit trail of what changed and when."],
};

const ACTION_VERBS = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  LOGIN: "signed in",
  REGISTER: "signed up",
  CHANGE_PASSWORD: "changed the password on",
  SEED: "seeded",
};

// Actions where naming the entity adds nothing ("signed in a user #1").
const SELF_ACTIONS = new Set(["LOGIN", "REGISTER"]);

function article(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

const ACTION_ICONS = {
  CREATE: "+",
  UPDATE: "✎",
  DELETE: "×",
  LOGIN: "→",
  REGISTER: "★",
  CHANGE_PASSWORD: "⚿",
  SEED: "◆",
};

const DEPT_ICONS = ["◆", "▲", "●", "■", "★", "▼"];

function employeeName(id) {
  const employee = state.employees.find((e) => e.id === id);
  return employee ? `${employee.first_name} ${employee.last_name}` : "Unknown";
}

function isAdmin() {
  return state.user && state.user.role === "admin";
}

/* ---------------- Data ---------------- */

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

/* ---------------- Overview ---------------- */

async function renderOverview() {
  const { stats, recent_activity } = await Api.get("/api/dashboard/stats");

  const cards = [
    { label: "Total tasks", value: stats.total_tasks, icon: "☰", tint: "var(--primary-soft)" },
    { label: "Employees", value: stats.total_employees, icon: "◉", tint: "var(--accent-soft)" },
    { label: "Departments", value: stats.total_departments, icon: "▣", tint: "var(--info-soft)" },
    { label: "Assignments", value: stats.total_assignments, icon: "◈", tint: "var(--warning-soft)" },
  ];

  document.getElementById("stat-grid").innerHTML = cards
    .map(
      (card, i) => `
      <div class="stat-card animate-in" style="--i:${i}; --accent-tint:${card.tint};">
        <div class="stat-top">
          <span class="stat-label">${card.label}</span>
          <span class="stat-icon">${card.icon}</span>
        </div>
        <div class="stat-value" data-count="${card.value}">0</div>
      </div>`
    )
    .join("");
  runCounters(document.getElementById("stat-grid"));

  setRing(document.getElementById("completion-ring"), stats.completion_rate);

  const max = Math.max(1, ...Object.values(stats.by_status));
  document.getElementById("status-breakdown").innerHTML = Object.entries(stats.by_status)
    .map(
      ([status, count]) => `
      <div class="meter-row">
        <div class="meter-head">
          <span class="badge ${badgeClass(status)}">${status}</span>
          <span class="meter-count">${count}</span>
        </div>
        <div class="meter-track"><span class="meter-fill" style="width:${(count / max) * 100}%"></span></div>
      </div>`
    )
    .join("");

  renderActivityList(document.getElementById("overview-activity"), recent_activity);
}

function renderActivityList(container, items) {
  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        ${Svg.emptyActivity}
        <div class="empty-title">Nothing logged yet</div>
        <div class="empty-sub">Actions across the workspace will show up here.</div>
      </div>`;
    return;
  }
  container.innerHTML = items
    .map((item, i) => {
      const verb = ACTION_VERBS[item.action] || item.action.toLowerCase();
      const icon = ACTION_ICONS[item.action] || "•";
      const target = SELF_ACTIONS.has(item.action)
        ? ""
        : ` ${article(item.entity_type)} ${item.entity_type}${item.entity_id ? ` #${item.entity_id}` : ""}`;
      return `
      <div class="activity-item" style="--i:${i}">
        <div class="act-icon act-${item.action}">${icon}</div>
        <div class="act-body">
          <div><strong>${escapeHtml(item.username)}</strong> ${verb}${target}</div>
          <div class="meta-time" title="${new Date(item.created_at).toLocaleString()}">${relativeTime(item.created_at)}</div>
        </div>
      </div>`;
    })
    .join("");
}

/* ---------------- Tasks ---------------- */

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

  const unassignedCards = unassigned
    .map(
      (t, i) => `
      <div class="task-card card-accent-${t.priority}" style="--i:${i}" data-open-assign="${t.id}">
        <div class="title">${escapeHtml(t.title)}</div>
        <div class="meta">
          <span class="text-muted">Tap to assign</span>
          <span class="badge ${badgeClass(t.priority)}">${t.priority}</span>
        </div>
      </div>`
    )
    .join("");

  const columns = [
    `<div class="kanban-col">
       <h3>Unassigned <span class="count">${unassigned.length}</span></h3>
       ${unassignedCards || `<div class="kanban-empty">Everything is assigned 🎉</div>`}
     </div>`,
  ];

  for (const status of STATUSES) {
    const items = assignments.filter((a) => a.status === status);
    const cards = items
      .map(
        (a, i) => `
        <div class="task-card card-accent-${a.task_priority}" style="--i:${i}" data-open-assignment="${a.id}" data-drag-id="${a.id}">
          <div class="title">${escapeHtml(a.task_title)}</div>
          <div class="meta">
            <span>${escapeHtml(employeeName(a.employee_id))}</span>
            <span class="badge ${badgeClass(a.task_priority)}">${a.task_priority}</span>
          </div>
          <div class="progress-bar"><span style="width:${a.completion_percentage}%"></span></div>
        </div>`
      )
      .join("");
    columns.push(`
      <div class="kanban-col" data-drop-status="${status}">
        <h3>${status} <span class="count">${items.length}</span></h3>
        ${cards || `<div class="kanban-empty">No tasks</div>`}
      </div>`);
  }

  const kanbanEl = document.getElementById("tasks-kanban");
  kanbanEl.innerHTML = columns.join("");

  kanbanEl.querySelectorAll("[data-open-assignment]").forEach((el) => {
    // Dragging fires its own click at drop time in some browsers — ignore
    // clicks that immediately follow a drag so the modal doesn't pop open.
    el.addEventListener("click", () => {
      if (el.dataset.justDragged) return;
      openAssignmentModal(Number(el.dataset.openAssignment));
    });
  });
  kanbanEl.querySelectorAll("[data-open-assign]").forEach((el) => {
    el.addEventListener("click", () => openAssignModal(Number(el.dataset.openAssign)));
  });

  enableKanbanDragDrop(kanbanEl, (assignmentId, newStatus, colEl) =>
    handleAssignmentDrop(assignmentId, newStatus, colEl)
  );
}

async function handleAssignmentDrop(assignmentId, newStatus, colEl) {
  const assignment = state.assignments.find((a) => a.id === Number(assignmentId));
  if (!assignment || assignment.status === newStatus) return;

  const card = document.querySelector(`[data-drag-id="${assignmentId}"]`);
  if (card) card.dataset.justDragged = "1";
  setTimeout(() => {
    if (card) delete card.dataset.justDragged;
  }, 300);

  try {
    await Api.put(`/api/assignments/${assignmentId}/status`, { status: newStatus });
    toast(`Moved to ${newStatus}`, "success");
    if (newStatus === "Completed") burstConfetti(colEl);
    await refreshData();
    renderTasks();
  } catch (err) {
    toast(err.message, "error");
  }
}

function renderTasksTable() {
  const tasks = filteredTasks();
  const body = document.getElementById("tasks-table-body");

  if (!tasks.length) {
    body.innerHTML = `<tr><td colspan="5">
      <div class="empty-state">
        ${Svg.emptyTasks}
        <div class="empty-title">No tasks match this filter</div>
        <div class="empty-sub">Try a different priority, or create a new task.</div>
      </div></td></tr>`;
    return;
  }

  body.innerHTML = tasks
    .map((t) => {
      const count = state.assignments.filter((a) => a.task_id === t.id).length;
      return `
      <tr>
        <td class="wrap" data-label="Task">
          <strong>${escapeHtml(t.title)}</strong>
          <div class="cell-sub">${escapeHtml(t.description || "No description")}</div>
        </td>
        <td data-label="Priority"><span class="badge ${badgeClass(t.priority)}">${t.priority}</span></td>
        <td data-label="Est. hrs">${t.estimated_hours || "—"}</td>
        <td data-label="Assignments">${count} assigned</td>
        <td data-label="Actions">
          <div class="cell-actions">
            <button class="btn btn-ghost btn-sm" data-assign="${t.id}">Assign</button>
            <button class="btn btn-ghost btn-sm" data-edit-task="${t.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete-task="${t.id}">Delete</button>
          </div>
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
  const ok = await confirmDialog("Delete this task and all of its assignments? This can't be undone.", {
    title: "Delete task",
    confirmLabel: "Delete task",
  });
  if (!ok) return;
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
  document.getElementById("assign-modal-sub").textContent = `Assigning “${task ? task.title : ""}”`;
  document.getElementById("assign-employee").innerHTML = state.employees
    .map(
      (e) =>
        `<option value="${e.id}">${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)} — ${escapeHtml(e.department_name || "")}</option>`
    )
    .join("");
  openModal("assign-modal");
}

document.getElementById("assign-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.post("/api/assignments", {
      task_id: document.getElementById("assign-task-id").value,
      employee_id: document.getElementById("assign-employee").value,
    });
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
  const newStatus = document.getElementById("assignment-status").value;
  const wasCompleted = state.assignments.find((a) => a.id === Number(id))?.status === "Completed";
  try {
    await Api.put(`/api/assignments/${id}/status`, {
      status: newStatus,
      completion_percentage: Number(document.getElementById("assignment-progress").value),
      remarks: document.getElementById("assignment-remarks").value,
    });
    toast("Assignment updated", "success");
    closeModal("assignment-modal");
    if (newStatus === "Completed" && !wasCompleted) burstConfetti(null);
    await refreshData();
    renderTasks();
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("unassign-btn").addEventListener("click", async () => {
  const id = document.getElementById("assignment-id").value;
  const ok = await confirmDialog("Remove this assignment? The employee will no longer see this task.", {
    title: "Remove assignment",
    confirmLabel: "Remove",
  });
  if (!ok) return;
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

/* ---------------- Employees ---------------- */

function renderEmployees() {
  document.getElementById("employees-table-body").innerHTML = state.employees
    .map((e) => {
      const fullName = `${e.first_name} ${e.last_name}`;
      return `
      <tr>
        <td data-label="Employee">
          <div class="cell-person">
            <div class="avatar avatar--sm" style="${avatarStyle(fullName)}">${initials(e.first_name, e.last_name)}</div>
            <span>${escapeHtml(fullName)}</span>
          </div>
        </td>
        <td data-label="Code">${escapeHtml(e.employee_code)}</td>
        <td data-label="Department">${escapeHtml(e.department_name || "—")}</td>
        <td data-label="Position">${escapeHtml(e.position || "—")}</td>
        <td data-label="Access"><span class="badge ${badgeClass(e.role)}">${escapeHtml(e.role || "employee")}</span></td>
        <td data-label="Contact">
          ${escapeHtml(e.email)}
          <div class="cell-sub">${escapeHtml(e.phone)}</div>
        </td>
        <td data-label="Actions">
          <div class="cell-actions">
            <button class="btn btn-ghost btn-sm" data-edit-employee="${e.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete-employee="${e.id}">Remove</button>
          </div>
        </td>
      </tr>`;
    })
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
  // Managers can add employees, but only an admin may grant elevated access.
  document.getElementById("employee-role-field").hidden = !isAdmin();
  document.getElementById("employee-role").value = "employee";

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
    if (isAdmin()) payload.role = document.getElementById("employee-role").value;
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
  const ok = await confirmDialog("Their login will be deactivated and they'll no longer be able to sign in.", {
    title: "Remove employee",
    confirmLabel: "Remove employee",
  });
  if (!ok) return;
  try {
    await Api.del(`/api/employees/${id}`);
    toast("Employee removed", "success");
    await refreshData();
    renderEmployees();
  } catch (err) {
    toast(err.message, "error");
  }
}

/* ---------------- Departments ---------------- */

function renderDepartments() {
  document.getElementById("departments-grid").innerHTML = state.departments
    .map((d, i) => {
      const count = state.employees.filter((e) => e.department_id === d.id).length;
      return `
      <div class="stat-card animate-in" style="--i:${i}; --accent-tint:transparent;">
        <div class="dept-card">
          <div class="dept-icon" style="${avatarStyle(d.name)}">${DEPT_ICONS[i % DEPT_ICONS.length]}</div>
          <div>
            <div class="stat-label">${escapeHtml(d.name)}</div>
            <div class="stat-value" style="font-size:24px;" data-count="${count}">0</div>
            <div class="stat-foot">${count === 1 ? "person" : "people"}</div>
          </div>
        </div>
      </div>`;
    })
    .join("");
  runCounters(document.getElementById("departments-grid"));
}

document.getElementById("new-department-btn").addEventListener("click", () => openModal("department-modal"));

document.getElementById("department-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.post("/api/departments", {
      name: document.getElementById("department-name").value.trim(),
      description: document.getElementById("department-description").value.trim(),
    });
    toast("Department created", "success");
    closeModal("department-modal");
    document.getElementById("department-form").reset();
    await refreshData();
    renderDepartments();
  } catch (err) {
    toast(err.message, "error");
  }
});

/* ---------------- Activity ---------------- */

async function renderActivity() {
  const { activity } = await Api.get("/api/dashboard/activity?limit=150");
  renderActivityList(document.getElementById("activity-log"), activity);
}

/* ---------------- Navigation ---------------- */

function showSectionSkeleton(name) {
  if (name === "tasks") {
    document.getElementById("tasks-kanban").innerHTML = skeletonKanban(6);
  } else if (name === "employees") {
    document.getElementById("employees-table-body").innerHTML = skeletonRows(4);
  } else if (name === "departments") {
    document.getElementById("departments-grid").innerHTML = Array.from({ length: 4 })
      .map(
        () => `
        <div class="stat-card">
          <div class="dept-card">
            <div class="skeleton skeleton-avatar" style="width:44px; height:44px; border-radius:13px;"></div>
            <div style="flex:1;">
              <div class="skeleton skeleton-line" style="width:60%;"></div>
              <div class="skeleton skeleton-line" style="width:30%; height:20px;"></div>
            </div>
          </div>
        </div>`
      )
      .join("");
  } else if (name === "activity") {
    document.getElementById("activity-log").innerHTML = skeletonList(6);
  }
}

async function showSection(name) {
  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === name);
  });
  updateNavIndicator();
  document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
  document.getElementById(`section-${name}`).classList.add("active");
  document.getElementById("page-title").textContent = PAGE_META[name][0];
  document.getElementById("page-sub").textContent = PAGE_META[name][1];

  showSectionSkeleton(name);

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
document.querySelectorAll("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => showSection(btn.dataset.jump));
});

/* ---------------- Password ---------------- */

document.getElementById("change-password-btn").addEventListener("click", () => openModal("password-modal"));

document.getElementById("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.post("/api/auth/change-password", {
      oldPassword: document.getElementById("old-password").value,
      newPassword: document.getElementById("new-password").value,
    });
    toast("Password updated", "success");
    e.target.reset();
    closeModal("password-modal");
  } catch (err) {
    toast(err.message, "error");
  }
});

/* ---------------- Boot ---------------- */

(async function init() {
  initShell();
  wireModals();

  const user = await guardPage(["admin", "manager"]);
  if (!user) return;
  state.user = user;

  const avatar = document.getElementById("user-avatar");
  avatar.textContent = initials(user.username, "");
  avatar.setAttribute("style", avatarStyle(user.username));
  avatar.title = `${user.username} (${user.role})`;

  setTaskView("kanban");
  await showSection("overview");
})();
