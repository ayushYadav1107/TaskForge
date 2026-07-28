from datetime import datetime

from ..extensions import db
from ..models import Task, TaskAssignment
from .activity_service import log as log_activity
from .errors import TaskError

PRIORITIES = ("Low", "Medium", "High", "Urgent")
UPDATABLE_FIELDS = ["title", "description", "notes", "priority", "estimated_hours"]


def create_task(fields, created_by):
    title = (fields.get("title") or "").strip()
    if not title:
        raise TaskError("Title is required")

    priority = fields.get("priority") or "Medium"
    if priority not in PRIORITIES:
        raise TaskError(f"Priority must be one of: {', '.join(PRIORITIES)}")

    estimated_hours = fields.get("estimated_hours")
    if estimated_hours not in (None, "") and float(estimated_hours) <= 0:
        raise TaskError("Estimated hours must be a positive number")

    task = Task(
        title=title,
        description=fields.get("description") or "",
        notes=fields.get("notes") or "",
        priority=priority,
        estimated_hours=estimated_hours or None,
        created_by=created_by,
    )
    db.session.add(task)
    db.session.commit()

    log_activity(created_by, "CREATE", "task", task.id, None, task.to_dict())
    return task


def get_task(task_id):
    task = Task.query.get(task_id)
    if not task or task.is_deleted:
        raise TaskError("Task not found", 404)
    return task


def update_task(task_id, fields, actor_id):
    task = get_task(task_id)
    before = task.to_dict()

    if "priority" in fields and fields["priority"] and fields["priority"] not in PRIORITIES:
        raise TaskError(f"Priority must be one of: {', '.join(PRIORITIES)}")
    if fields.get("estimated_hours") not in (None, "") and "estimated_hours" in fields:
        if float(fields["estimated_hours"]) <= 0:
            raise TaskError("Estimated hours must be a positive number")

    for key in UPDATABLE_FIELDS:
        if key in fields and fields[key] is not None:
            setattr(task, key, fields[key] if fields[key] != "" else None)
    task.updated_at = datetime.utcnow()

    db.session.commit()
    log_activity(actor_id, "UPDATE", "task", task.id, before, task.to_dict())
    return task


def delete_task(task_id, actor_id):
    task = get_task(task_id)
    before = task.to_dict()

    task.is_deleted = True
    task.updated_at = datetime.utcnow()
    TaskAssignment.query.filter_by(task_id=task_id).delete()
    db.session.commit()

    log_activity(actor_id, "DELETE", "task", task_id, before, None)
    return True


def list_tasks(filters=None):
    filters = filters or {}
    query = Task.query.filter_by(is_deleted=False)

    if filters.get("priority"):
        query = query.filter_by(priority=filters["priority"])
    if filters.get("created_by"):
        query = query.filter_by(created_by=filters["created_by"])

    tasks = query.order_by(Task.created_at.desc()).all()

    if filters.get("status"):
        matching_task_ids = {
            a.task_id for a in TaskAssignment.query.filter_by(status=filters["status"]).all()
        }
        tasks = [t for t in tasks if t.id in matching_task_ids]

    return tasks
