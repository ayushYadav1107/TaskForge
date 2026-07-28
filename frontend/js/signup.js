applySavedTheme();
attachRipples(document);
attachHeroParallax();

const form = document.getElementById("signup-form");
const errorBox = document.getElementById("form-error");
const submitBtn = document.getElementById("signup-btn");
const departmentSelect = document.getElementById("department");

(async function redirectIfSignedIn() {
  try {
    const { user } = await Api.get("/api/auth/me");
    window.location.href = landingFor(user);
  } catch (_) {
    // Not signed in — carry on with signup.
  }
})();

(async function loadDepartments() {
  try {
    const { departments } = await Api.get("/api/auth/departments");
    departmentSelect.innerHTML = departments
      .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`)
      .join("");
  } catch (err) {
    departmentSelect.innerHTML = `<option value="">Could not load departments</option>`;
  }
})();

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
  errorBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.display = "none";

  const payload = {
    first_name: document.getElementById("first-name").value.trim(),
    last_name: document.getElementById("last-name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    department_id: departmentSelect.value,
    position: document.getElementById("position").value.trim(),
    username: document.getElementById("username").value.trim(),
    password: document.getElementById("password").value,
  };

  if (Object.entries(payload).some(([key, value]) => key !== "position" && !value)) {
    showError("Please fill in every field except position, which is optional.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account…";

  try {
    const { user } = await Api.post("/api/auth/register", payload);
    window.location.href = landingFor(user);
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";
  }
});
