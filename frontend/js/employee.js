const STATUSES = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"];

const state = { user: null, assignments: [] };

const PAGE_META = {
  "my-tasks": ["My Tasks", "Everything currently on your plate."],
  profile: ["Profile", "Your details and account settings."],
};

async function loadAssignments() {
  const { assignments } = await Api.get(`/api/assignments/employee/${state.user.employee.id}`);
  state.assignments = assignments;
}

function renderStats() {
  const total = state.assignments.length;
  const completed = state.assignments.filter((a) => a.status === "Completed").length;
  const inProgress = state.assignments.filter((a) => a.status === "In Progress").length;
  const urgent = state.assignments.filter(
    (a) => ["High", "Urgent"].includes(a.task_priority) && a.status !== "Completed"
  ).length;

  const cards = [
    { label: "Assigned", value: total, icon: "☰", tint: "var(--primary-soft)" },
    { label: "In progress", value: inProgress, icon: "◐", tint: "var(--info-soft)" },
    { label: "Completed", value: completed, icon: "✓", tint: "var(--success-soft)" },
    { label: "Needs attention", value: urgent, icon: "!", tint: "var(--danger-soft)" },
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

  const avg = total
    ? Math.round(state.assignments.reduce((sum, a) => sum + a.completion_percentage, 0) / total)
    : 0;
  setRing(document.getElementById("completion-ring"), avg);

  const byStatus = {};
  for (const status of STATUSES) {
    byStatus[status] = state.assignments.filter((a) => a.status === status).length;
  }
  const max = Math.max(1, ...Object.values(byStatus));
  document.getElementById("status-breakdown").innerHTML = Object.entries(byStatus)
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
}

function renderKanban() {
  const container = document.getElementById("my-kanban");

  if (!state.assignments.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        ${Svg.emptyTasks}
        <div class="empty-title">Nothing assigned yet</div>
        <div class="empty-sub">When your manager assigns you work, it'll appear here.</div>
      </div>`;
    return;
  }

  container.innerHTML = STATUSES.map((status) => {
    const items = state.assignments.filter((a) => a.status === status);
    const cards = items
      .map(
        (a, i) => `
        <div class="task-card card-accent-${a.task_priority}" style="--i:${i}" data-open="${a.id}" data-drag-id="${a.id}">
          <div class="title">${escapeHtml(a.task_title)}</div>
          <div class="meta">
            <span class="text-muted">${a.task_estimated_hours ? `${a.task_estimated_hours}h est.` : "No estimate"}</span>
            <span class="badge ${badgeClass(a.task_priority)}">${a.task_priority}</span>
          </div>
          <div class="progress-bar"><span style="width:${a.completion_percentage}%"></span></div>
        </div>`
      )
      .join("");
    return `
      <div class="kanban-col" data-drop-status="${status}">
        <h3>${status} <span class="count">${items.length}</span></h3>
        ${cards || `<div class="kanban-empty">Nothing here</div>`}
      </div>`;
  }).join("");

  container.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.justDragged) return;
      openAssignmentModal(Number(el.dataset.open));
    });
  });

  enableKanbanDragDrop(container, (assignmentId, newStatus, colEl) =>
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
    await loadAssignments();
    renderStats();
    renderKanban();
  } catch (err) {
    toast(err.message, "error");
  }
}

function openAssignmentModal(id) {
  const a = state.assignments.find((x) => x.id === id);
  if (!a) return;
  document.getElementById("assignment-id").value = a.id;
  document.getElementById("assignment-modal-title").textContent = a.task_title;
  document.getElementById("assignment-modal-sub").textContent = a.task_description || "No description provided.";
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
    toast("Task updated", "success");
    closeModal("assignment-modal");
    if (newStatus === "Completed" && !wasCompleted) burstConfetti(null);
    await loadAssignments();
    renderStats();
    renderKanban();
  } catch (err) {
    toast(err.message, "error");
  }
});

function renderProfile() {
  const emp = state.user.employee;
  const fullName = `${emp.first_name} ${emp.last_name}`;
  document.getElementById("profile-card").innerHTML = `
    <div class="card-header"><h2>Profile</h2></div>
    <div class="profile-head">
      <div class="avatar avatar--lg" style="${avatarStyle(fullName)}">${initials(emp.first_name, emp.last_name)}</div>
      <div>
        <div class="p-name">${escapeHtml(fullName)}</div>
        <div class="p-role">${escapeHtml(emp.position || "Team member")} · ${escapeHtml(emp.department_name || "")}</div>
      </div>
      <span class="badge ${badgeClass(state.user.role)}" style="margin-left:auto;">${escapeHtml(state.user.role)}</span>
    </div>
    <div class="detail-grid">
      <div><div class="detail-label">Employee code</div><div class="detail-value">${escapeHtml(emp.employee_code)}</div></div>
      <div><div class="detail-label">Username</div><div class="detail-value">${escapeHtml(state.user.username)}</div></div>
      <div><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(emp.email)}</div></div>
      <div><div class="detail-label">Phone</div><div class="detail-value">${escapeHtml(emp.phone)}</div></div>
    </div>`;
}

document.getElementById("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.post("/api/auth/change-password", {
      oldPassword: document.getElementById("old-password").value,
      newPassword: document.getElementById("new-password").value,
    });
    toast("Password updated", "success");
    e.target.reset();
  } catch (err) {
    toast(err.message, "error");
  }
});

document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.section;
    document.querySelectorAll(".nav-item[data-section]").forEach((b) => b.classList.toggle("active", b === btn));
    updateNavIndicator();
    document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
    document.getElementById(`section-${name}`).classList.add("active");
    document.getElementById("page-title").textContent = PAGE_META[name][0];
    document.getElementById("page-sub").textContent = PAGE_META[name][1];
  });
});

(async function init() {
  initShell();
  wireModals();

  const user = await guardPage(["employee"]);
  if (!user) return;

  if (!user.employee) {
    document.querySelector(".main").innerHTML = `
      <div class="card"><div class="empty-state">
        ${Svg.emptyActivity}
        <div class="empty-title">No employee profile linked</div>
        <div class="empty-sub">Contact your administrator to finish setting up your account.</div>
      </div></div>`;
    return;
  }

  state.user = user;
  const avatar = document.getElementById("user-avatar");
  const fullName = `${user.employee.first_name} ${user.employee.last_name}`;
  avatar.textContent = initials(user.employee.first_name, user.employee.last_name);
  avatar.setAttribute("style", avatarStyle(fullName));
  avatar.title = user.username;

  await loadAssignments();
  renderStats();
  renderKanban();
  renderProfile();
})();
