from flask import Blueprint, g, jsonify, request

from ..auth_decorators import login_required
from ..models import TaskAssignment
from ..services import task_service
from ..services.errors import TaskError

task_bp = Blueprint("task", __name__)


@task_bp.route("", methods=["POST"])
@login_required
def create_task():
    try:
        task = task_service.create_task(request.get_json(silent=True) or {}, g.current_user.id)
        return jsonify({"task": task.to_dict()}), 201
    except TaskError as err:
        return jsonify({"error": err.message}), err.status


@task_bp.route("", methods=["GET"])
@login_required
def list_tasks():
    filters = {
        "priority": request.args.get("priority"),
        "created_by": request.args.get("created_by"),
        "status": request.args.get("status"),
    }
    tasks = task_service.list_tasks(filters)
    result = []
    for t in tasks:
        count = TaskAssignment.query.filter_by(task_id=t.id).count()
        result.append(t.to_dict(assignment_count=count))
    return jsonify({"tasks": result})


@task_bp.route("/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id):
    try:
        return jsonify({"task": task_service.get_task(task_id).to_dict()})
    except TaskError as err:
        return jsonify({"error": err.message}), err.status


@task_bp.route("/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    try:
        task = task_service.update_task(task_id, request.get_json(silent=True) or {}, g.current_user.id)
        return jsonify({"task": task.to_dict()})
    except TaskError as err:
        return jsonify({"error": err.message}), err.status


@task_bp.route("/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    try:
        task_service.delete_task(task_id, g.current_user.id)
        return jsonify({"ok": True})
    except TaskError as err:
        return jsonify({"error": err.message}), err.status
