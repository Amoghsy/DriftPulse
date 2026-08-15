#!/usr/bin/env bash

# DriftPulse One-Click Startup Script for Git Bash / Linux / macOS

echo "===================================================="
echo "      🚀 Starting DriftPulse SOC Intelligence"
echo "===================================================="

# Navigate to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# 1. Activate backend virtual environment
VENV_PATH="$PROJECT_ROOT/backend/.venv"

if [ -d "$VENV_PATH" ]; then
    echo "🐍 Activating Python virtual environment..."
    if [ -f "$VENV_PATH/Scripts/activate" ]; then
        source "$VENV_PATH/Scripts/activate"
    elif [ -f "$VENV_PATH/bin/activate" ]; then
        source "$VENV_PATH/bin/activate"
    fi
else
    echo "⚠️ Warning: Virtual environment not found at backend/.venv. Using standard Python."
fi

# 2. Run Alembic Database Migrations
echo "🗄️ Checking and applying Alembic database migrations..."
(cd "$PROJECT_ROOT/backend" && python -m alembic upgrade head)

# Function to gracefully kill backend and frontend on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down DriftPulse services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 3. Start FastAPI Backend Server
echo "⚡ Starting FastAPI Backend (http://localhost:8000)..."
(cd "$PROJECT_ROOT/backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# Give backend a moment to boot
sleep 2

# 4. Start React Frontend Server
echo "💻 Starting React Frontend UI (http://localhost:5173)..."
(cd "$PROJECT_ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "===================================================="
echo "✨ DriftPulse System Ready!"
echo "   - Frontend UI:  http://localhost:5173"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs:    http://localhost:8000/docs"
echo "===================================================="
echo "Press Ctrl+C to stop all servers."

# Keep script running and wait for background processes
wait
