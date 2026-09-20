"""Authentication and role guards.

`login_required` resolves the session user once per request and parks it on
`g`, so downstream guards and handlers never re-query it.
"""
from functools import wraps

from flask import g, jsonify, session

from .extensions import db
from .models import User


def current_user():
    return g.get("current_user")


def current_employee():
    user = current_user()
    return user.employee if user else None


def _resolve_session_user():
    user_id = session.get("user_id")
    if not user_id:
        return None, ("Authentication required", 401)

    user = db.session.get(User, user_id)
    if not user or not user.is_active:
        session.clear()
        return None, ("Your session is no longer valid, please sign in again", 401)

    # A role change (or a demotion) must take effect immediately rather than
    # waiting for the stale copy in the cookie to expire.
    if session.get("role") != user.role:
        session["role"] = user.role

    return user, None


def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        user, failure = _resolve_session_user()
        if failure:
            message, status = failure
            return jsonify({"error": message}), status
        g.current_user = user
        return f(*args, **kwargs)

    return wrapped


def roles_required(*roles):
    """Allows the request only for the listed roles. Implies `login_required`."""

    def decorator(f):
        @wraps(f)
        @login_required
        def wrapped(*args, **kwargs):
            if g.current_user.role not in roles:
                return jsonify({"error": "You do not have permission to do that"}), 403
            return f(*args, **kwargs)

        return wrapped

    return decorator
