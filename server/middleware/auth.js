const db = require("../db/jsonStore");

function requireAuth(req, res, next) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  const user = db.table("users").find(userId);
  if (!user || !user.is_active) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Session is no longer valid" });
  }

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to do that" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
