@echo off
echo ====================================================
echo       🚀 Starting DriftPulse SOC Intelligence
echo ====================================================

cd /d "%~dp0"

echo 🐍 Activating Python virtual environment...
call backend\.venv\Scripts\activate.bat

echo 🗄️ Running Alembic database migrations...
cd backend
call alembic upgrade head
cd ..

echo ⚡ Starting FastAPI Backend Server...
start "DriftPulse Backend API" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo 💻 Starting React Frontend UI...
cd frontend
npm run dev
