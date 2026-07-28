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

function toast(message, type = "info") {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast--visible"));
  setTimeout(() => {
    el.classList.remove("toast--visible");
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

function badgeClass(value) {
  return `badge-${String(value || "").replace(/\s+/g, "")}`;
}

function initials(first, last) {
  return `${(first || "?")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function guardPage(allowedRoles) {
  try {
    const { user } = await Api.get("/api/auth/me");
    if (!allowedRoles.includes(user.role)) {
      window.location.href = user.role === "employee" ? "/employee" : "/admin";
      return null;
    }
    return user;
  } catch (err) {
    window.location.href = "/index.html";
    return null;
  }
}

async function logout() {
  try {
    await Api.post("/api/auth/logout");
  } finally {
    window.location.href = "/index.html";
  }
}
