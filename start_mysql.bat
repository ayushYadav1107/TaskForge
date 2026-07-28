@echo off
REM Starts the local MySQL server that TaskForge uses (installed via
REM `scoop install mysql-lts`). Leave this window open while you work —
REM closing it stops the database. Run this before `python backend/run.py`.

echo Starting MySQL on port 3306 (Ctrl+C to stop)...
mysqld --console
