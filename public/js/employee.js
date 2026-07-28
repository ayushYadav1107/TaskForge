const state = { user: null, assignments: [] };
const STATUSES = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"];

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

async function loadAssignments() {
  const employeeId = state.user.employee.id;
  const { assignments } = await Api.get(`/api/assignments/employee/${employeeId}`);
  state.assignments = assignments;
}

function renderStats() {
  const total = state.assignments.length;
  const completed = state.assignments.filter((a) => a.status === "Completed").length;
  const inProgress = state.assignments.filter((a) => a.status === "In Progress").length;
  const avg = total
    ? Math.round(state.assignments.reduce((sum, a) => sum + a.completion_percentage, 0) / total)
    : 0;

  document.getElementById("stat-grid").innerHTML = `
    <div class="stat-card"><div class="stat-label">Assigned</div><div class="stat-value">${total}</div></div>
    <div class="stat-card"><div class="stat-label">In progress</div><div class="stat-value">${inProgress}</div></div>
    <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div></div>
    <div class="stat-card"><div class="stat-label">Avg. completion</div><div class="stat-value accent">${avg}%</div></div>
  `;
}

function renderKanban() {
  const columns = STATUSES.map((status) => {
    const items = state.assignments.filter((a) => a.status === status);
    const cards = items
      .map(
        (a) => `
        <div class="task-card" data-open="${a.id}">
          <div class="title">${escapeHtml(a.task_title)}</div>
          <div class="meta">
            <span class="text-muted">${escapeHtml(a.task_estimated_hours ? a.task_estimated_hours + "h" : "")}</span>
            <span class="badge ${badgeClass(a.task_priority)}">${a.task_priority}</span>
          </div>
          <div class="progress-bar"><span style="width:${a.completion_percentage}%"></span></div>
        </div>`
      )
      .join("");
    return `
      <div class="kanban-col">
        <h3>${status} <span class="count">${items.length}</span></h3>
        ${cards || `<div class="text-muted" style="font-size:12.5px;">Nothing here</div>`}
      </div>`;
  });

  document.getElementById("my-kanban").innerHTML = columns.join("");
  document.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", () => openAssignmentModal(Number(el.dataset.open)));
  });
}

function openAssignmentModal(id) {
  const a = state.assignments.find((x) => x.id === id);
  if (!a) return;
  document.getElementById("assignment-id").value = a.id;
  document.getElementById("assignment-modal-title").textContent = a.task_title;
  document.getElementById("assignment-modal-sub").textContent = a.task_description || "";
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
    toast("Task updated", "success");
    closeModal("assignment-modal");
    await loadAssignments();
    renderStats();
    renderKanban();
  } catch (err) {
    toast(err.message, "error");
  }
});

function renderProfile() {
  const emp = state.user.employee;
  document.getElementById("profile-card").innerHTML = `
    <div class="card-header"><h2>Profile</h2></div>
    <div style="display:flex; gap:18px; align-items:center; margin-bottom:18px;">
      <div class="avatar" style="width:56px; height:56px; font-size:18px;">${initials(emp.first_name, emp.last_name)}</div>
      <div>
        <div style="font-weight:700; font-size:17px;">${escapeHtml(emp.first_name)} ${escapeHtml(emp.last_name)}</div>
        <div class="text-muted">${escapeHtml(emp.position || "")} · ${escapeHtml(emp.department_name || "")}</div>
      </div>
    </div>
    <div class="form-row">
      <div><div class="text-muted" style="font-size:12px;">Employee code</div><div>${escapeHtml(emp.employee_code)}</div></div>
      <div><div class="text-muted" style="font-size:12px;">Username</div><div>${escapeHtml(state.user.username)}</div></div>
      <div><div class="text-muted" style="font-size:12px;">Email</div><div>${escapeHtml(emp.email)}</div></div>
      <div><div class="text-muted" style="font-size:12px;">Phone</div><div>${escapeHtml(emp.phone)}</div></div>
    </div>
  `;
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

const PAGE_META = {
  "my-tasks": ["My Tasks", "Everything currently on your plate."],
  profile: ["Profile", "Your details and account settings."],
};

document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item[data-section]").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
    document.getElementById(`section-${btn.dataset.section}`).classList.add("active");
    document.getElementById("page-title").textContent = PAGE_META[btn.dataset.section][0];
    document.getElementById("page-sub").textContent = PAGE_META[btn.dataset.section][1];
  });
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

(async function init() {
  const user = await guardPage(["employee"]);
  if (!user) return;
  if (!user.employee) {
    document.body.innerHTML = "<p style='padding:40px;font-family:sans-serif;'>No employee profile is linked to this account yet. Contact your administrator.</p>";
    return;
  }
  state.user = user;
  document.getElementById("user-avatar").textContent = initials(user.employee.first_name, user.employee.last_name);
  document.getElementById("user-avatar").title = user.username;
  await loadAssignments();
  renderStats();
  renderKanban();
  renderProfile();
})();
