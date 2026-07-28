"""Populates the database with sample departments, users, and tasks.

Run via `flask --app task_management seed` (see backend/run.py for the
FLASK_APP entrypoint), or `python -m task_management.seed` from backend/.
"""
from datetime import date, datetime

from werkzeug.security import generate_password_hash

from .extensions import db
from .models import ActivityLog, Department, Employee, Task, TaskAssignment, User


def _hash(password):
    return generate_password_hash(password, method="scrypt")


def run():
    db.drop_all()
    db.create_all()

    # --- Users & the owner account ------------------------------------
    ayush = User(username="ayush.yadav", password_hash=_hash("Ayush@123"), role="admin")
    manager_user = User(username="priya.mehta", password_hash=_hash("Manager@123"), role="manager")
    emp_users = [
        User(username=name, password_hash=_hash("Employee@123"), role="employee")
        for name in ["aarav.sharma", "rohan.patel", "ananya.iyer", "kabir.singh"]
    ]
    db.session.add_all([ayush, manager_user, *emp_users])
    db.session.flush()

    # --- Departments -----------------------------------------------------
    dept_names = ["Engineering", "Design", "Sales", "Human Resources"]
    departments = [Department(name=name, description=f"{name} department") for name in dept_names]
    db.session.add_all(departments)
    db.session.flush()
    engineering, design, sales, hr = departments

    # --- Employees ---------------------------------------------------------
    employee_seed = [
        (emp_users[0], engineering, "ENG-001", "Aarav", "Sharma", "aarav.sharma@taskforge.dev", "9876500001", "Software Engineer"),
        (emp_users[1], sales, "SAL-001", "Rohan", "Patel", "rohan.patel@taskforge.dev", "9876500002", "Sales Executive"),
        (emp_users[2], design, "DES-001", "Ananya", "Iyer", "ananya.iyer@taskforge.dev", "9876500003", "UI/UX Designer"),
        (emp_users[3], engineering, "ENG-002", "Kabir", "Singh", "kabir.singh@taskforge.dev", "9876500004", "QA Engineer"),
    ]
    employees = []
    for user, dept, code, first, last, email, phone, position in employee_seed:
        employee = Employee(
            user_id=user.id,
            department_id=dept.id,
            employee_code=code,
            first_name=first,
            last_name=last,
            email=email,
            phone=phone,
            position=position,
            hire_date=date(2024, 1, 15),
        )
        db.session.add(employee)
        employees.append(employee)

    db.session.add(
        Employee(
            user_id=manager_user.id,
            department_id=hr.id,
            employee_code="HR-001",
            first_name="Priya",
            last_name="Mehta",
            email="priya.mehta@taskforge.dev",
            phone="9876500005",
            position="HR Manager",
            hire_date=date(2023, 6, 1),
        )
    )
    db.session.flush()

    # --- Tasks + assignments -----------------------------------------------
    task_seed = [
        ("Design new landing page", "Create a fresh landing page design for the product relaunch", "High", 12, [(employees[2], "In Progress", 60)]),
        ("Fix login session bug", "Users are randomly logged out after 5 minutes of inactivity", "Urgent", 4, [(employees[0], "Pending", 0)]),
        ("Prepare Q3 sales report", "Compile the quarterly sales figures for leadership review", "Medium", 6, [(employees[1], "Completed", 100)]),
        ("Write regression test suite", "Add automated regression coverage for the checkout flow", "Medium", 10, [(employees[3], "In Progress", 30)]),
        ("Onboard new hires", "Set up accounts, laptops, and orientation for this month's new hires", "Low", 5, [(employees[0], "On Hold", 10)]),
    ]

    for title, description, priority, hours, assignments in task_seed:
        task = Task(
            title=title,
            description=description,
            notes="",
            priority=priority,
            estimated_hours=hours,
            created_by=ayush.id,
        )
        db.session.add(task)
        db.session.flush()

        for employee, status, pct in assignments:
            db.session.add(
                TaskAssignment(task_id=task.id, employee_id=employee.id, status=status, completion_percentage=pct)
            )

    db.session.add(
        ActivityLog(
            user_id=ayush.id,
            action="SEED",
            entity_type="system",
            entity_id=None,
            after_state={"message": "Database seeded with sample data"},
            created_at=datetime.utcnow(),
        )
    )

    db.session.commit()

    print("Seed complete.")
    print("  Admin login:    ayush.yadav / Ayush@123")
    print("  Manager login:  priya.mehta / Manager@123")
    print("  Employee login: aarav.sharma / Employee@123 (also rohan.patel, ananya.iyer, kabir.singh)")


if __name__ == "__main__":
    from . import create_app

    app = create_app()
    with app.app_context():
        run()
