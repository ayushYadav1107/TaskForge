from flask import Blueprint, g, jsonify, request

from ..auth_decorators import current_employee, login_required, roles_required
from ..services import employee_service
from ..services.errors import EmployeeError

employee_bp = Blueprint("employee", __name__)


@employee_bp.route("", methods=["POST"])
@roles_required("admin", "manager")
def create_employee():
    body = request.get_json(silent=True) or {}
    requested_role = body.get("role")
    if requested_role in ("admin", "manager") and g.current_user.role != "admin":
        return jsonify({"error": "Only an admin can create manager or admin accounts"}), 403

    try:
        employee = employee_service.create_employee(body, g.current_user.id)
        return jsonify({"employee": employee.to_dict()}), 201
    except EmployeeError as err:
        return jsonify({"error": err.message}), err.status


@employee_bp.route("", methods=["GET"])
@roles_required("admin", "manager")
def list_employees():
    employees = employee_service.list_employees()
    return jsonify({"employees": [e.to_dict() for e in employees]})


@employee_bp.route("/department/<int:department_id>", methods=["GET"])
@roles_required("admin", "manager")
def list_by_department(department_id):
    employees = employee_service.list_employees_by_department(department_id)
    return jsonify({"employees": [e.to_dict() for e in employees]})


@employee_bp.route("/<int:employee_id>", methods=["GET"])
@login_required
def get_employee(employee_id):
    mine = current_employee()
    if g.current_user.role not in ("admin", "manager") and not (mine and mine.id == employee_id):
        return jsonify({"error": "You can only view your own profile"}), 403
    try:
        return jsonify({"employee": employee_service.get_employee(employee_id).to_dict()})
    except EmployeeError as err:
        return jsonify({"error": err.message}), err.status


@employee_bp.route("/<int:employee_id>", methods=["PUT"])
@roles_required("admin", "manager")
def update_employee(employee_id):
    try:
        employee = employee_service.update_employee(
            employee_id, request.get_json(silent=True) or {}, g.current_user.id
        )
        return jsonify({"employee": employee.to_dict()})
    except EmployeeError as err:
        return jsonify({"error": err.message}), err.status


@employee_bp.route("/<int:employee_id>", methods=["DELETE"])
@roles_required("admin", "manager")
def delete_employee(employee_id):
    try:
        employee_service.delete_employee(employee_id, g.current_user.id)
        return jsonify({"ok": True})
    except EmployeeError as err:
        return jsonify({"error": err.message}), err.status
