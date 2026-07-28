const bcrypt = require("bcryptjs");
const db = require("./jsonStore");

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

function run() {
  db.reset();

  // --- Users & the owner account -----------------------------------------
  const ayush = db.table("users").insert({
    username: "ayush.yadav",
    password_hash: hash("Ayush@123"),
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const managerUser = db.table("users").insert({
    username: "priya.mehta",
    password_hash: hash("Manager@123"),
    role: "manager",
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const empUsers = ["aarav.sharma", "rohan.patel", "ananya.iyer", "kabir.singh"].map((username) =>
    db.table("users").insert({
      username,
      password_hash: hash("Employee@123"),
      role: "employee",
      is_active: true,
      created_at: new Date().toISOString(),
    })
  );

  // --- Departments ---------------------------------------------------------
  const departments = ["Engineering", "Design", "Sales", "Human Resources"].map((name, i) =>
    db.table("departments").insert({
      name,
      description: `${name} department`,
    })
  );

  // --- Employees -------------------------------------------------------------
  const employeeSeed = [
    {
      user: empUsers[0],
      dept: departments[0],
      code: "ENG-001",
      first: "Aarav",
      last: "Sharma",
      email: "aarav.sharma@taskforge.dev",
      phone: "9876500001",
      position: "Software Engineer",
    },
    {
      user: empUsers[1],
      dept: departments[2],
      code: "SAL-001",
      first: "Rohan",
      last: "Patel",
      email: "rohan.patel@taskforge.dev",
      phone: "9876500002",
      position: "Sales Executive",
    },
    {
      user: empUsers[2],
      dept: departments[1],
      code: "DES-001",
      first: "Ananya",
      last: "Iyer",
      email: "ananya.iyer@taskforge.dev",
      phone: "9876500003",
      position: "UI/UX Designer",
    },
    {
      user: empUsers[3],
      dept: departments[0],
      code: "ENG-002",
      first: "Kabir",
      last: "Singh",
      email: "kabir.singh@taskforge.dev",
      phone: "9876500004",
      position: "QA Engineer",
    },
  ];

  const employees = employeeSeed.map((e) =>
    db.table("employees").insert({
      user_id: e.user.id,
      department_id: e.dept.id,
      employee_code: e.code,
      first_name: e.first,
      last_name: e.last,
      email: e.email,
      phone: e.phone,
      position: e.position,
      hire_date: "2024-01-15",
      is_active: true,
      created_at: new Date().toISOString(),
    })
  );

  db.table("employees").insert({
    user_id: managerUser.id,
    department_id: departments[3].id,
    employee_code: "HR-001",
    first_name: "Priya",
    last_name: "Mehta",
    email: "priya.mehta@taskforge.dev",
    phone: "9876500005",
    position: "HR Manager",
    hire_date: "2023-06-01",
    is_active: true,
    created_at: new Date().toISOString(),
  });

  // --- Tasks + assignments -----------------------------------------------
  const now = new Date().toISOString();
  const taskSeed = [
    {
      title: "Design new landing page",
      description: "Create a fresh landing page design for the product relaunch",
      priority: "High",
      estimated_hours: 12,
      assign: [{ emp: employees[2], status: "In Progress", pct: 60 }],
    },
    {
      title: "Fix login session bug",
      description: "Users are randomly logged out after 5 minutes of inactivity",
      priority: "Urgent",
      estimated_hours: 4,
      assign: [{ emp: employees[0], status: "Pending", pct: 0 }],
    },
    {
      title: "Prepare Q3 sales report",
      description: "Compile the quarterly sales figures for leadership review",
      priority: "Medium",
      estimated_hours: 6,
      assign: [{ emp: employees[1], status: "Completed", pct: 100 }],
    },
    {
      title: "Write regression test suite",
      description: "Add automated regression coverage for the checkout flow",
      priority: "Medium",
      estimated_hours: 10,
      assign: [{ emp: employees[3], status: "In Progress", pct: 30 }],
    },
    {
      title: "Onboard new hires",
      description: "Set up accounts, laptops, and orientation for this month's new hires",
      priority: "Low",
      estimated_hours: 5,
      assign: [{ emp: employees[0], status: "On Hold", pct: 10 }],
    },
  ];

  for (const t of taskSeed) {
    const task = db.table("tasks").insert({
      title: t.title,
      description: t.description,
      notes: "",
      priority: t.priority,
      estimated_hours: t.estimated_hours,
      created_by: ayush.id,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    });

    for (const a of t.assign) {
      db.table("task_assignments").insert({
        task_id: task.id,
        employee_id: a.emp.id,
        status: a.status,
        completion_percentage: a.pct,
        remarks: "",
        assigned_at: now,
        updated_at: now,
      });
    }
  }

  db.table("activity_logs").insert({
    user_id: ayush.id,
    action: "SEED",
    entity_type: "system",
    entity_id: null,
    before_state: null,
    after_state: { message: "Database seeded with sample data" },
    created_at: now,
  });

  console.log("Seed complete.");
  console.log("  Admin login:    ayush.yadav / Ayush@123");
  console.log("  Manager login:  priya.mehta / Manager@123");
  console.log("  Employee login: aarav.sharma / Employee@123 (also rohan.patel, ananya.iyer, kabir.singh)");
}

if (require.main === module) {
  run();
}

module.exports = { run };
