from flask import Blueprint, jsonify, request

from ..auth_decorators import login_required
from ..models import Department, Employee, Task, TaskAssignment
from ..services import activity_service

dashboard_bp = Blueprint("dashboard", __name__)

STATUSES = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"]


@dashboard_bp.route("/stats", methods=["GET"])
@login_required
def stats():
    total_tasks = Task.query.filter_by(is_deleted=False).count()
    total_employees = Employee.query.filter_by(is_active=True).count()
    total_departments = Department.query.count()
    assignments = TaskAssignment.query.all()

    by_status = {status: 0 for status in STATUSES}
    for a in assignments:
        by_status[a.status] = by_status.get(a.status, 0) + 1

    completed = by_status.get("Completed", 0)
    completion_rate = round((completed / len(assignments)) * 100) if assignments else 0

    return jsonify(
        {
            "stats": {
                "total_tasks": total_tasks,
                "total_employees": total_employees,
                "total_departments": total_departments,
                "total_assignments": len(assignments),
                "completion_rate": completion_rate,
                "by_status": by_status,
            },
            "recent_activity": activity_service.list_recent(10),
        }
    )


@dashboard_bp.route("/activity", methods=["GET"])
@login_required
def activity():
    limit = min(request.args.get("limit", default=50, type=int) or 50, 200)
    return jsonify({"activity": activity_service.list_recent(limit)})
