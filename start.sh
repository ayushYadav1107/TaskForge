#!/usr/bin/env bash
set -e

cd backend

# Create tables if they don't exist (idempotent — safe on every restart)
flask --app task_management init-db

# Start the production WSGI server
exec gunicorn \
  --workers 2 \
  --bind "0.0.0.0:${PORT:-5000}" \
  --timeout 120 \
  --log-level info \
  "task_management:create_app()"
