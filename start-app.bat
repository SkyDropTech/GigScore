@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo   Starting GigScore Full-Stack Application
echo ================================================================
echo.

:: 1. Detect Python executable
set "PY_CMD=python"
if exist "%~dp0backend\venv\Scripts\python.exe" (
    set "PY_CMD=%~dp0backend\venv\Scripts\python.exe"
    echo [*] Using backend virtualenv Python: !PY_CMD!
) else (
    echo [*] Using system Python: !PY_CMD!
)

:: 2. Launch Backend API in a separate named terminal
start "GigScore Backend API (Port 8000)" cmd /k "cd /d "%~dp0backend" && "!PY_CMD!" -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1 --limit-concurrency 200 --backlog 2048"

:: 3. Launch Frontend Vite Server in a separate named terminal
start "GigScore Frontend Server (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ================================================================
echo   Services Launched Successfully!
echo ================================================================
echo   [*] Backend API:    http://127.0.0.1:8000
echo   [*] API Docs:       http://127.0.0.1:8000/docs
echo   [*] Frontend App:   http://localhost:5173
echo ================================================================
echo.
