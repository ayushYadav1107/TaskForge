from flask import Blueprint, g, jsonify, request

from ..auth_decorators import login_required
from ..services import assignment_service
from ..services.errors import AssignmentError

assignment_bp = Blueprint("assignment", __name__)


@assignment_bp.route("", methods=["POST"])
@login_required
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
        assignment = assignment_service.update_assignment_status(
            assignment_id, request.get_json(silent=True) or {}, g.current_user.id
        )
        return jsonify({"assignment": assignment.to_dict()})
    except AssignmentError as err:
        return jsonify({"error": err.message}), err.status


@assignment_bp.route("/<int:assignment_id>", methods=["DELETE"])
@login_required
def delete_assignment(assignment_id):
    try:
        assignment_service.remove_assignment(assignment_id, g.current_user.id)
        return jsonify({"ok": True})
    except AssignmentError as err:
        return jsonify({"error": err.message}), err.status


@assignment_bp.route("/employee/<int:employee_id>", methods=["GET"])
@login_required
def by_employee(employee_id):
    return jsonify({"assignments": assignment_service.get_assignments_for_employee(employee_id)})


@assignment_bp.route("/task/<int:task_id>", methods=["GET"])
@login_required
def by_task(task_id):
    return jsonify({"assignments": assignment_service.get_assignments_for_task(task_id)})


@assignment_bp.route("", methods=["GET"])
@login_required
def list_all():
    return jsonify({"assignments": assignment_service.list_all_assignments()})
