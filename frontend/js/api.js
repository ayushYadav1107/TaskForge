/* Shared front-end helpers for TaskForge — API client, motion, UI utilities. */

const Api = (() => {
  async function request(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }

    if (!res.ok) {
      const error = new Error((payload && payload.error) || `Request failed (${res.status})`);
      error.status = res.status;
      throw error;
    }
    return payload;
  }

  return {
    get: (url) => request("GET", url),
    post: (url, body) => request("POST", url, body),
    put: (url, body) => request("PUT", url, body),
    del: (url) => request("DELETE", url),
  };
})();

/* ---------------- Formatting ---------------- */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function badgeClass(value) {
  return `badge-${String(value || "").replace(/\s+/g, "")}`;
}

function initials(first, last) {
  return `${(first || "?")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* Deterministic gradient per person, so avatars stay stable across reloads. */
function avatarStyle(seed) {
  let hash = 0;
  const text = String(seed || "?");
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) % 360;
  return `background: linear-gradient(135deg, hsl(${hash} 68% 58%), hsl(${(hash + 42) % 360} 66% 46%));`;
}

/* ---------------- Motion ---------------- */

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateCount(el, to, suffix = "", duration = 900) {
  if (!el) return;
  // requestAnimationFrame never fires in a hidden tab, so paint the real
  // value straight away rather than leaving a stale zero on screen.
  if (prefersReducedMotion() || document.hidden) {
    el.textContent = `${to}${suffix}`;
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${Math.round(to * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* Counts up every [data-count] inside a container once it's in the DOM. */
function runCounters(root = document) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    animateCount(el, Number(el.dataset.count), el.dataset.suffix || "");
  });
}

/* Fills a progress ring, letting the browser paint the 0 state first so the
   CSS transition has something to animate from. */
function setRing(el, percent) {
  if (!el) return;
  const circle = el.querySelector(".ring-value");
  const radius = Number(circle.getAttribute("r"));
  const circumference = 2 * Math.PI * radius;
  const filled = `${circumference * (1 - percent / 100)}`;

  circle.style.strokeDasharray = `${circumference}`;

  if (prefersReducedMotion() || document.hidden) {
    circle.style.strokeDashoffset = filled;
  } else {
    circle.style.strokeDashoffset = `${circumference}`;
    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = filled;
    });
  }
  animateCount(el.querySelector(".ring-label"), percent, "%");
}

function attachRipples(scope = document) {
  scope.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn || prefersReducedMotion()) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

/* ---------------- Toasts ---------------- */

const TOAST_ICONS = { success: "✓", error: "!", info: "i" };

function toast(message, type = "info") {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span><span>${escapeHtml(message)}</span>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast--visible"));
  setTimeout(() => {
    el.classList.remove("toast--visible");
    setTimeout(() => el.remove(), 300);
  }, 3400);
}

/* Tilts a card toward the cursor and drives the spotlight highlight —
   both read the --rx/--ry/--mx/--my custom properties set here. */
function attachTilt(root = document, selector = ".stat-card, .task-card") {
  if (prefersReducedMotion()) return;

  root.addEventListener("pointermove", (e) => {
    const card = e.target.closest(selector);
    if (!card || card.dataset.tiltOff) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const maxTilt = 6;
    card.style.setProperty("--ry", `${(px - 0.5) * maxTilt * 2}deg`);
    card.style.setProperty("--rx", `${(0.5 - py) * maxTilt * 2}deg`);
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
    card.classList.add("tilt-active");
  });

  root.addEventListener(
    "pointerleave",
    (e) => {
      const card = e.target.closest && e.target.closest(selector);
      if (!card) return;
      card.classList.remove("tilt-active");
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    },
    true
  );
}

/* Subtle mouse-follow tilt for the auth-page hero illustration. */
function attachHeroParallax(selector = ".brand-hero svg") {
  if (prefersReducedMotion()) return;
  const svg = document.querySelector(selector);
  const stage = svg && svg.closest(".auth-brand");
  if (!svg || !stage) return;

  stage.addEventListener("pointermove", (e) => {
    const rect = stage.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    svg.style.transform = `rotateX(${py * -6}deg) rotateY(${px * 8}deg)`;
  });
  stage.addEventListener("pointerleave", () => {
    svg.style.transform = "";
  });
}

/* ---------------- Skeleton loading placeholders ---------------- */

function skeletonKanban(columns = 5) {
  return `<div class="skeleton-kanban">${Array.from({ length: columns })
    .map(
      () => `
      <div class="kanban-col">
        <div class="skeleton skeleton-line" style="width:60%; height:11px;"></div>
        <div class="skeleton skeleton-card" style="height:70px;"></div>
        <div class="skeleton skeleton-card" style="height:70px;"></div>
      </div>`
    )
    .join("")}</div>`;
}

function skeletonRows(count = 4) {
  return Array.from({ length: count })
    .map(
      () => `
      <tr>
        <td colspan="99" style="padding:10px 6px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex:1;">
              <div class="skeleton skeleton-line" style="width:40%;"></div>
              <div class="skeleton skeleton-line" style="width:65%;"></div>
            </div>
          </div>
        </td>
      </tr>`
    )
    .join("");
}

function skeletonList(count = 4) {
  return Array.from({ length: count })
    .map(
      () => `
      <div style="display:flex; align-items:center; gap:12px; padding:9px 0;">
        <div class="skeleton skeleton-avatar" style="border-radius:10px;"></div>
        <div style="flex:1;">
          <div class="skeleton skeleton-line" style="width:70%;"></div>
          <div class="skeleton skeleton-line" style="width:35%;"></div>
        </div>
      </div>`
    )
    .join("");
}

/* ---------------- Confetti ---------------- */

const CONFETTI_COLORS = ["#6d5ef8", "#14b8a6", "#f59e0b", "#22c55e", "#ef4444"];

function burstConfetti(originEl) {
  if (prefersReducedMotion()) return;
  const rect = originEl ? originEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let i = 0; i < 22; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 90;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 40;
    const rotate = Math.random() * 360;
    const size = 6 + Math.random() * 5;

    piece.style.background = color;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.6}px`;
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.borderRadius = Math.random() > 0.5 ? "2px" : "50%";

    document.body.appendChild(piece);

    const anim = piece.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx * 1.15}px, ${dy + 90}px) rotate(${rotate * 1.4}deg)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.2,.7,.3,1)" }
    );
    anim.onfinish = () => piece.remove();
  }
}

/* ---------------- Custom confirm dialog ---------------- */

let confirmDialogEl = null;

function ensureConfirmDialog() {
  if (confirmDialogEl) return confirmDialogEl;
  const el = document.createElement("div");
  el.className = "modal-overlay";
  el.id = "confirm-dialog";
  el.hidden = true;
  el.innerHTML = `
    <div class="modal" style="max-width:380px;">
      <div class="confirm-icon" id="confirm-dialog-icon">!</div>
      <h2 id="confirm-dialog-title">Are you sure?</h2>
      <p class="modal-sub" id="confirm-dialog-message"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="confirm-dialog-cancel">Cancel</button>
        <button type="button" class="btn btn-danger" id="confirm-dialog-ok">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener("click", (e) => {
    if (e.target === el) el.hidden = true;
  });
  confirmDialogEl = el;
  return el;
}

/* Promise-based replacement for window.confirm() that matches the app's
   design system. Resolves true/false; never rejects. */
function confirmDialog(message, { title = "Are you sure?", confirmLabel = "Confirm", danger = true } = {}) {
  const el = ensureConfirmDialog();
  el.querySelector("#confirm-dialog-title").textContent = title;
  el.querySelector("#confirm-dialog-message").textContent = message;
  const okBtn = el.querySelector("#confirm-dialog-ok");
  const cancelBtn = el.querySelector("#confirm-dialog-cancel");
  const icon = el.querySelector("#confirm-dialog-icon");
  okBtn.textContent = confirmLabel;
  okBtn.className = danger ? "btn btn-danger" : "btn btn-primary";
  icon.className = danger ? "confirm-icon" : "confirm-icon confirm-icon--neutral";
  icon.textContent = danger ? "!" : "?";

  el.hidden = false;

  return new Promise((resolve) => {
    function cleanup(result) {
      el.hidden = true;
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onKey);
      resolve(result);
    }
    function onOk() {
      cleanup(true);
    }
    function onCancel() {
      cleanup(false);
    }
    function onKey(e) {
      if (e.key === "Escape") cleanup(false);
    }
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    document.addEventListener("keydown", onKey);
  });
}

/* ---------------- Kanban drag & drop ---------------- */

/* Wires HTML5 drag/drop on every [data-drag-id] card inside `container`,
   dropping onto a [data-drop-status] column calls onDrop(id, status). */
function enableKanbanDragDrop(container, onDrop) {
  let draggedId = null;

  container.querySelectorAll("[data-drag-id]").forEach((card) => {
    card.setAttribute("draggable", "true");
    card.addEventListener("dragstart", (e) => {
      draggedId = card.dataset.dragId;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedId);
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      draggedId = null;
    });
  });

  container.querySelectorAll("[data-drop-status]").forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      col.classList.add("drag-over");
    });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = draggedId || e.dataTransfer.getData("text/plain");
      if (id) onDrop(id, col.dataset.dropStatus, col);
    });
  });
}

/* ---------------- SVG assets ---------------- */

const Svg = {
  emptyTasks: `
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="100" cy="132" rx="62" ry="8" fill="currentColor" opacity=".08"/>
      <rect x="52" y="26" width="96" height="102" rx="10" fill="currentColor" opacity=".07"/>
      <rect x="52" y="26" width="96" height="102" rx="10" stroke="currentColor" stroke-opacity=".22" stroke-width="2"/>
      <rect x="68" y="14" width="64" height="22" rx="7" fill="currentColor" opacity=".16"/>
      <rect x="68" y="56" width="52" height="7" rx="3.5" fill="currentColor" opacity=".26"/>
      <rect x="68" y="72" width="64" height="7" rx="3.5" fill="currentColor" opacity=".18"/>
      <rect x="68" y="88" width="40" height="7" rx="3.5" fill="currentColor" opacity=".18"/>
      <circle cx="140" cy="104" r="20" fill="var(--primary)" opacity=".14"/>
      <path d="M132 104h16M140 96v16" stroke="var(--primary)" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`,

  emptyActivity: `
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="100" cy="132" rx="58" ry="8" fill="currentColor" opacity=".08"/>
      <circle cx="100" cy="72" r="42" fill="currentColor" opacity=".07"/>
      <circle cx="100" cy="72" r="42" stroke="currentColor" stroke-opacity=".2" stroke-width="2"/>
      <path d="M100 50v24l16 10" stroke="var(--primary)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="100" cy="72" r="4" fill="var(--primary)"/>
    </svg>`,
};

/* ---------------- Auth + shell ---------------- */

async function guardPage(allowedRoles) {
  try {
    const { user } = await Api.get("/api/auth/me");
    if (!allowedRoles.includes(user.role)) {
      window.location.href = user.role === "employee" ? "/employee" : "/admin";
      return null;
    }
    return user;
  } catch (err) {
    window.location.href = "/";
    return null;
  }
}

async function logout() {
  try {
    await Api.post("/api/auth/logout");
  } finally {
    window.location.href = "/";
  }
}

function landingFor(user) {
  return user.role === "employee" ? "/employee" : "/admin";
}

function applySavedTheme() {
  const saved = localStorage.getItem("taskforge-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}

/* Slides a little pill alongside whichever nav item is active, instead of
   popping a new indicator into existence on every section switch. Call
   this again any time a caller toggles the .active class on a nav item. */
function updateNavIndicator() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  let indicator = sidebar.querySelector(".nav-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.className = "nav-indicator";
    sidebar.appendChild(indicator);
  }

  const active = sidebar.querySelector(".nav-item.active");
  if (!active) {
    indicator.classList.remove("visible");
    return;
  }
  const sidebarRect = sidebar.getBoundingClientRect();
  const itemRect = active.getBoundingClientRect();
  const indicatorHeight = 18;
  const top = itemRect.top - sidebarRect.top + (itemRect.height - indicatorHeight) / 2;

  indicator.style.height = `${indicatorHeight}px`;
  indicator.style.transform = `translateY(${top}px)`;
  indicator.classList.add("visible");
}

/* Wires up the pieces every dashboard shares: theme, drawer nav, logout, ripples. */
function initShell() {
  applySavedTheme();
  attachRipples(document);
  attachTilt(document);

  updateNavIndicator();
  let navResizeFrame = null;
  window.addEventListener("resize", () => {
    if (navResizeFrame) return;
    navResizeFrame = requestAnimationFrame(() => {
      updateNavIndicator();
      navResizeFrame = null;
    });
  });

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const root = document.documentElement;
      const next = (root.getAttribute("data-theme") || "light") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("taskforge-theme", next);
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("nav-scrim");
  const toggle = document.getElementById("nav-toggle");

  function closeDrawer() {
    if (!sidebar) return;
    sidebar.classList.remove("open");
    if (scrim) scrim.classList.remove("visible");
  }

  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      if (scrim) scrim.classList.toggle("visible", sidebar.classList.contains("open"));
    });
  }
  if (scrim) scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 820px)").matches) closeDrawer();
    });
  });

  return { closeDrawer };
}

/* Shared modal helpers. */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}
function wireModals() {
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.hidden = true;
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal-overlay:not([hidden])").forEach((m) => (m.hidden = true));
  });
}
