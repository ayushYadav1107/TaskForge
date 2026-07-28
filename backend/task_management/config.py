import os
from urllib.parse import quote_plus

from dotenv import load_dotenv

# Load backend/.env explicitly (by path, not cwd) so `flask` CLI commands and
# `python run.py` behave the same whether they're launched from the repo
# root or from inside backend/.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


class Config:
    """Reads every setting from the environment so the same code runs against
    a local MySQL instance or a hosted one without code changes."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "taskforge-dev-secret-ayush-yadav")

    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = os.environ.get("DB_PORT", "3306")
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_NAME = os.environ.get("DB_NAME", "taskforge")

    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or (
        f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("FLASK_ENV") == "production"

    JSON_SORT_KEYS = False
