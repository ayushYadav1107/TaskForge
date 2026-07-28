const bcrypt = require("bcryptjs");
const db = require("../db/jsonStore");
const { AuthError } = require("../utils/errors");
const activityService = require("./activityService");

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function authenticateUser(username, password) {
  const user = db.table("users").findOne((u) => u.username === username);
  if (!user || !user.is_active) throw new AuthError("Invalid username or password", 401);

  const matches = bcrypt.compareSync(password, user.password_hash);
  if (!matches) throw new AuthError("Invalid username or password", 401);

  activityService.log(user.id, "LOGIN", "user", user.id);
  return sanitizeUser(user);
}

function changePassword(userId, oldPassword, newPassword) {
  const user = db.table("users").find(userId);
  if (!user) throw new AuthError("User not found", 404);

  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    throw new AuthError("Current password is incorrect", 400);
  }
  if (!newPassword || newPassword.length < 6) {
    throw new AuthError("New password must be at least 6 characters", 400);
  }

  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.table("users").update(userId, { password_hash });
  activityService.log(userId, "CHANGE_PASSWORD", "user", userId);
  return true;
}

function getProfile(userId) {
  const user = db.table("users").find(userId);
  if (!user) throw new AuthError("User not found", 404);

  const profile = sanitizeUser(user);
  const employee = db.table("employees").findOne((e) => e.user_id === userId);
  if (employee) {
    const department = db.table("departments").find(employee.department_id);
    profile.employee = Object.assign({}, employee, {
      department_name: department ? department.name : null,
    });
  }
  return profile;
}

module.exports = { authenticateUser, changePassword, getProfile, sanitizeUser };
