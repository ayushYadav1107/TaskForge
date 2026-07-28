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

/* Wires up the pieces every dashboard shares: theme, drawer nav, logout, ripples. */
function initShell() {
  applySavedTheme();
  attachRipples(document);

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
