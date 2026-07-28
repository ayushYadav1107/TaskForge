const express = require("express");
const db = require("../db/jsonStore");
const activityService = require("../services/activityService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/stats", (req, res) => {
  const tasks = db.table("tasks").filter((t) => !t.is_deleted);
  const assignments = db.table("task_assignments").all();
  const employees = db.table("employees").filter((e) => e.is_active);
  const departments = db.table("departments").all();

  const byStatus = {};
  for (const status of ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"]) {
    byStatus[status] = assignments.filter((a) => a.status === status).length;
  }

  const completed = byStatus["Completed"] || 0;
  const completionRate = assignments.length ? Math.round((completed / assignments.length) * 100) : 0;

  res.json({
    stats: {
      total_tasks: tasks.length,
      total_employees: employees.length,
      total_departments: departments.length,
      total_assignments: assignments.length,
      completion_rate: completionRate,
      by_status: byStatus,
    },
    recent_activity: activityService.listRecent(10),
  });
});

router.get("/activity", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json({ activity: activityService.listRecent(limit) });
});

module.exports = router;
