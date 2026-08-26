#!/bin/bash
# DRISHTI-AI — One-command startup script

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              DRISHTI-AI Startup Script               ║"
echo "║  Disaster Risk Intelligence & Safety Tracking Hub    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Train ML model if not exists
if [ ! -f "ml/models/risk_classifier.joblib" ]; then
  echo "🧠 Training ML models (first run)..."
  python ml/train.py
  echo "✅ ML models trained!"
fi

# Start backend
echo "🚀 Starting FastAPI backend on http://localhost:8000 ..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 4
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start frontend
echo "🌐 Starting React frontend on http://localhost:5173 ..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ DRISHTI-AI is running!                           ║"
echo "║                                                      ║"
echo "║  Frontend:  http://localhost:5173                    ║"
echo "║  Backend:   http://localhost:8000                    ║"
echo "║  API Docs:  http://localhost:8000/api/docs           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop both services"

wait $BACKEND_PID $FRONTEND_PID
