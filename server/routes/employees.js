const express = require("express");
const employeeService = require("../services/employeeService");
const { requireAuth, requireRole } = require("../middleware/auth");
const { EmployeeError } = require("../utils/errors");

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), (req, res) => {
  try {
    const employee = employeeService.createEmployee(req.body || {}, req.user.id);
    res.status(201).json({ employee });
  } catch (err) {
    if (err instanceof EmployeeError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.get("/", (req, res) => {
  res.json({ employees: employeeService.listEmployees() });
});

router.get("/department/:departmentId", (req, res) => {
  res.json({ employees: employeeService.listEmployeesByDepartment(req.params.departmentId) });
});

router.get("/:id", (req, res) => {
  try {
    res.json({ employee: employeeService.getEmployee(req.params.id) });
  } catch (err) {
    if (err instanceof EmployeeError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.put("/:id", requireRole("admin", "manager"), (req, res) => {
  try {
    const employee = employeeService.updateEmployee(req.params.id, req.body || {}, req.user.id);
    res.json({ employee });
  } catch (err) {
    if (err instanceof EmployeeError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.delete("/:id", requireRole("admin", "manager"), (req, res) => {
  try {
    employeeService.deleteEmployee(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof EmployeeError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

module.exports = router;
