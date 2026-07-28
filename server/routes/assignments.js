const express = require("express");
const assignmentService = require("../services/assignmentService");
const { requireAuth } = require("../middleware/auth");
const { AssignmentError } = require("../utils/errors");

const router = express.Router();
router.use(requireAuth);

router.post("/", (req, res) => {
  const { task_id, employee_id } = req.body || {};
  if (!task_id || !employee_id) {
    return res.status(400).json({ error: "task_id and employee_id are required" });
  }
  try {
    const assignment = assignmentService.assignTaskToEmployee(task_id, employee_id, req.user.id);
    res.status(201).json({ assignment });
  } catch (err) {
    if (err instanceof AssignmentError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.put("/:id/status", (req, res) => {
  try {
    const assignment = assignmentService.updateAssignmentStatus(req.params.id, req.body || {}, req.user.id);
    res.json({ assignment });
  } catch (err) {
    if (err instanceof AssignmentError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.delete("/:id", (req, res) => {
  try {
    assignmentService.removeAssignment(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof AssignmentError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.get("/employee/:employeeId", (req, res) => {
  res.json({ assignments: assignmentService.getAssignmentsForEmployee(req.params.employeeId) });
});

router.get("/task/:taskId", (req, res) => {
  res.json({ assignments: assignmentService.getAssignmentsForTask(req.params.taskId) });
});

router.get("/", (req, res) => {
  res.json({ assignments: assignmentService.listAllAssignments() });
});

module.exports = router;
