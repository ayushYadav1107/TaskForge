const express = require("express");
const taskService = require("../services/taskService");
const { requireAuth } = require("../middleware/auth");
const { TaskError } = require("../utils/errors");

const router = express.Router();
router.use(requireAuth);

router.post("/", (req, res) => {
  try {
    const task = taskService.createTask(req.body || {}, req.user.id);
    res.status(201).json({ task });
  } catch (err) {
    if (err instanceof TaskError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.get("/", (req, res) => {
  const { priority, created_by, status } = req.query;
  res.json({ tasks: taskService.listTasks({ priority, created_by, status }) });
});

router.get("/:id", (req, res) => {
  try {
    res.json({ task: taskService.getTask(req.params.id) });
  } catch (err) {
    if (err instanceof TaskError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.put("/:id", (req, res) => {
  try {
    const task = taskService.updateTask(req.params.id, req.body || {}, req.user.id);
    res.json({ task });
  } catch (err) {
    if (err instanceof TaskError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.delete("/:id", (req, res) => {
  try {
    taskService.deleteTask(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof TaskError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

module.exports = router;
