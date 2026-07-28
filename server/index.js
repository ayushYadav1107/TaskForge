const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const config = require("./config");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departments");
const assignmentRoutes = require("./routes/assignments");
const dashboardRoutes = require("./routes/dashboard");

if (!fs.existsSync(config.dbFile)) {
  console.log("No database found — seeding sample data...");
  require("./db/seed").run();
}

const app = express();

app.use(express.json());
app.use(
  session({
    name: "taskforge.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});
app.get("/employee", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "employee.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(config.port, () => {
  console.log(`TaskForge running at http://localhost:${config.port}`);
});
