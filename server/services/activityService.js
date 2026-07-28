const db = require("../db/jsonStore");

function log(userId, action, entityType, entityId, before = null, after = null) {
  return db.table("activity_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_state: before,
    after_state: after,
    created_at: new Date().toISOString(),
  });
}

function listRecent(limit = 25) {
  return db
    .table("activity_logs")
    .all()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit)
    .map((entry) => {
      const user = db.table("users").find(entry.user_id);
      return Object.assign({}, entry, { username: user ? user.username : "system" });
    });
}

module.exports = { log, listRecent };
