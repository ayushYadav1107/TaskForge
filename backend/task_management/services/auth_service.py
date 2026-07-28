import re

from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from ..models import Department, Employee, User
from . import employee_service
from .activity_service import log as log_activity
from .errors import AuthError

USERNAME_RE = re.compile(r"^[a-zA-Z0-9._-]{3,30}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

REGISTER_FIELDS = ["username", "password", "first_name", "last_name", "email", "phone", "department_id"]


def authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if not user or not user.is_active:
        raise AuthError("Invalid username or password", 401)
    if not check_password_hash(user.password_hash, password):
        raise AuthError("Invalid username or password", 401)

    log_activity(user.id, "LOGIN", "user", user.id)
    return user


def register_user(fields):
    """Public self-service signup. Always creates a plain `employee` account —
    manager and admin accounts can only be created by an existing admin
    through the employee management screen."""
    missing = [f for f in REGISTER_FIELDS if not fields.get(f)]
    if missing:
        verb = "are" if len(missing) > 1 else "is"
        raise AuthError(f"{', '.join(missing)} {verb} required")

    username = str(fields["username"]).strip()
    email = str(fields["email"]).strip()
    password = str(fields["password"])

    if not USERNAME_RE.match(username):
        raise AuthError("Username must be 3-30 characters, using letters, numbers, dot, dash or underscore")
    if len(password) < 6:
        raise AuthError("Password must be at least 6 characters")
    if not EMAIL_RE.match(email):
        raise AuthError("Please enter a valid email address")
    if User.query.filter(db.func.lower(User.username) == username.lower()).first():
        raise AuthError("That username is already taken")
    if Employee.query.filter(db.func.lower(Employee.email) == email.lower()).first():
        raise AuthError("An account with that email already exists")
    if not Department.query.get(fields.get("department_id")):
        raise AuthError("Please choose a valid department")

    user = User(username=username, password_hash=generate_password_hash(password, method="scrypt"), role="employee")
    db.session.add(user)
    db.session.flush()

    try:
        employee_service.create_employee(
            {
                "user_id": user.id,
                "department_id": fields["department_id"],
                "employee_code": employee_service.generate_employee_code(fields["department_id"]),
                "first_name": str(fields["first_name"]).strip(),
                "last_name": str(fields["last_name"]).strip(),
                "email": email,
                "phone": str(fields["phone"]).strip(),
                "position": (fields.get("position") or "").strip() or "Team Member",
            },
            user.id,
        )
    except Exception as err:
        # Don't leave an orphaned login behind if the profile couldn't be created.
        db.session.rollback()
        raise AuthError(getattr(err, "message", str(err)))

    log_activity(user.id, "REGISTER", "user", user.id)
    return user


def change_password(user_id, old_password, new_password):
    user = User.query.get(user_id)
    if not user:
        raise AuthError("User not found", 404)
    if not check_password_hash(user.password_hash, old_password):
        raise AuthError("Current password is incorrect")
    if not new_password or len(new_password) < 6:
        raise AuthError("New password must be at least 6 characters")

    user.password_hash = generate_password_hash(new_password, method="scrypt")
    db.session.commit()
    log_activity(user_id, "CHANGE_PASSWORD", "user", user_id)
    return True


def get_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        raise AuthError("User not found", 404)

    profile = user.to_dict()
    if user.employee:
        profile["employee"] = user.employee.to_dict()
    return profile
