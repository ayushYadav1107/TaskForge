const express = require("express");
const employeeService = require("../services/employeeService");
const { requireAuth, requireRole } = require("../middleware/auth");
const { EmployeeError } = require("../utils/errors");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json({ departments: employeeService.listDepartments() });
});

router.post("/", requireRole("admin", "manager"), (req, res) => {
  try {
    const department = employeeService.createDepartment(req.body || {}, req.user.id);
    res.status(201).json({ department });
  } catch (err) {
    if (err instanceof EmployeeError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

module.exports = router;
