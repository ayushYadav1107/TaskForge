from functools import wraps

from flask import g, jsonify, session

from .models import User


def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401

        user = User.query.get(user_id)
        if not user or not user.is_active:
            session.clear()
            return jsonify({"error": "Session is no longer valid"}), 401

        g.current_user = user
        return f(*args, **kwargs)

    return wrapped


def roles_required(*roles):
    def decorator(f):
        @login_required
        @wraps(f)
        def wrapped(*args, **kwargs):
            if g.current_user.role not in roles:
                return jsonify({"error": "You do not have permission to do that"}), 403
            return f(*args, **kwargs)

        return wrapped

    return decorator
