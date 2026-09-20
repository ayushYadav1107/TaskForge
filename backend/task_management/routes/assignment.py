from flask import Blueprint, g, jsonify, request

from ..auth_decorators import current_employee, login_required, roles_required
from ..services import assignment_service
from ..services.errors import AssignmentError

assignment_bp = Blueprint("assignment", __name__)

MANAGES_ASSIGNMENTS = ("admin", "manager")


def _is_manager():
    return g.current_user.role in MANAGES_ASSIGNMENTS


def _owns(employee_id):
    employee = current_employee()
    return employee is not None and employee.id == employee_id


@assignment_bp.route("", methods=["POST"])
@roles_required(*MANAGES_ASSIGNMENTS)
def create_assignment():
    body = request.get_json(silent=True) or {}
    task_id, employee_id = body.get("task_id"), body.get("employee_id")
    if not task_id or not employee_id:
        return jsonify({"error": "task_id and employee_id are required"}), 400

    try:
        assignment = assignment_service.assign_task_to_employee(task_id, employee_id, g.current_user.id)
        return jsonify({"assignment": assignment.to_dict()}), 201
    except AssignmentError as err:
        return jsonify({"error": err.message}), err.status


@assignment_bp.route("/<int:assignment_id>/status", methods=["PUT"])
@login_required
def update_status(assignment_id):
    try:
        assignment = assignment_service.get_assignment(assignment_id)
        # An employee may move their own work along, and nobody else's.
        if not _is_manager() and not _owns(assignment.employee_id):
            return jsonify({"error": "You can only update tasks assigned to you"}), 403

        updated = assignment_service.update_assignment_status(
            assignment_id, request.get_json(silent=True) or {}, g.current_user.id
        )
        return jsonify({"assignment": updated.to_dict()})
    except AssignmentError as err:
        return jsonify({"error": err.message}), err.status


@assignment_bp.route("/<int:assignment_id>", methods=["DELETE"])
@roles_required(*MANAGES_ASSIGNMENTS)
def delete_assignment(assignment_id):
    try:
        assignment_service.remove_assignment(assignment_id, g.current_user.id)
        return jsonify({"ok": True})
    except AssignmentError as err:
        return jsonify({"error": err.message}), err.status


@assignment_bp.route("/employee/<int:employee_id>", methods=["GET"])
@login_required
def by_employee(employee_id):
    if not _is_manager() and not _owns(employee_id):
        return jsonify({"error": "You can only view your own assignments"}), 403
    return jsonify({"assignments": assignment_service.get_assignments_for_employee(employee_id)})


@assignment_bp.route("/task/<int:task_id>", methods=["GET"])
@roles_required(*MANAGES_ASSIGNMENTS)
def by_task(task_id):
    return jsonify({"assignments": assignment_service.get_assignments_for_task(task_id)})


@assignment_bp.route("", methods=["GET"])
@roles_required(*MANAGES_ASSIGNMENTS)
def list_all():
    return jsonify({"assignments": assignment_service.list_all_assignments()})


@assignment_bp.route("/mine", methods=["GET"])
@login_required
def mine():
    """The employee dashboard's own view — avoids the client having to know
    its own employee id before it can ask for anything."""
    employee = current_employee()
    if not employee:
        return jsonify({"assignments": []})
    return jsonify({"assignments": assignment_service.get_assignments_for_employee(employee.id)})
