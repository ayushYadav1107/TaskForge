import os

from flask import Flask, send_from_directory

from .config import Config
from .extensions import db

FRONTEND_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
)


def create_app(config_object=Config):
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    app.config.from_object(config_object)

    db.init_app(app)

    from . import models  # noqa: F401  (registers models with SQLAlchemy metadata)
    from .routes import register_routes

    register_routes(app)
    register_page_routes(app)
    register_error_handlers(app)
    register_cli(app)

    return app


def register_page_routes(app):
    """Serves the vanilla-JS frontend straight out of /frontend."""

    @app.route("/")
    def serve_login():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/signup")
    def serve_signup():
        return send_from_directory(FRONTEND_DIR, "signup.html")

    @app.route("/admin")
    def serve_admin():
        return send_from_directory(FRONTEND_DIR, "admin.html")

    @app.route("/employee")
    def serve_employee():
        return send_from_directory(FRONTEND_DIR, "employee.html")


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(err):
        from flask import jsonify, request

        if request.path.startswith("/api/"):
            return jsonify({"error": "Not found"}), 404
        return send_from_directory(FRONTEND_DIR, "index.html"), 404

    @app.errorhandler(500)
    def server_error(err):
        from flask import jsonify

        app.logger.exception(err)
        return jsonify({"error": "Something went wrong on the server"}), 500


def register_cli(app):
    @app.cli.command("init-db")
    def init_db():
        """Creates every table from the SQLAlchemy models (flask init-db)."""
        db.create_all()
        print("Database tables created.")

    @app.cli.command("seed")
    def seed():
        """Populates sample departments/users/tasks (flask seed)."""
        from .seed import run

        run()
