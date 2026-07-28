const express = require("express");
const authService = require("../services/authService");
const { requireAuth } = require("../middleware/auth");
const { AuthError } = require("../utils/errors");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  try {
    const user = authService.authenticateUser(username, password);
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ user });
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.post("/change-password", requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "oldPassword and newPassword are required" });
  }
  try {
    authService.changePassword(req.user.id, oldPassword, newPassword);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.get("/me", requireAuth, (req, res) => {
  try {
    res.json({ user: authService.getProfile(req.user.id) });
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

module.exports = router;
