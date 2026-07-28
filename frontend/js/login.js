applySavedTheme();
attachRipples(document);

(async function redirectIfSignedIn() {
  try {
    const { user } = await Api.get("/api/auth/me");
    window.location.href = landingFor(user);
  } catch (_) {
    // Not signed in — stay on the login page.
  }
})();

const form = document.getElementById("login-form");
const errorBox = document.getElementById("form-error");
const submitBtn = document.getElementById("login-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.display = "none";
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in…";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const { user } = await Api.post("/api/auth/login", { username, password });
    window.location.href = landingFor(user);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign in";
  }
});
