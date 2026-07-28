@echo off
REM TaskForge setup — Flask + MySQL + vanilla JS
REM Run this from the project root: setup_project.bat

echo === TaskForge setup ===

cd backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

if not exist .env (
    echo Creating backend\.env from .env.example - edit it with your MySQL credentials.
    copy .env.example .env
)

set FLASK_APP=task_management

echo.
echo Next steps:
echo   1. Create the MySQL database:      mysql -u root -p -e "CREATE DATABASE taskforge"
echo   2. Edit backend\.env with your MySQL credentials
echo   3. Create the tables:               flask init-db
echo   4. Load sample data (optional):     flask seed
echo   5. Run the app:                     python run.py
echo.
echo Then open http://localhost:5000

cd ..
