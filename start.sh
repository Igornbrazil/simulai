#!/bin/bash
# SimulAI - Script de inicialização sem Docker

set -e

echo ""
echo "⚡ SimulAI - Iniciando..."
echo ""

# Backend
echo "📦 Instalando dependências do backend..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q
echo "✅ Backend pronto"

# Start backend in background
echo "🚀 Iniciando backend na porta 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Frontend
cd ../frontend
echo ""
echo "📦 Instalando dependências do frontend..."
npm install -q
echo "✅ Frontend pronto"

echo ""
echo "🌐 Iniciando frontend na porta 3000..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ SimulAI está rodando!"
echo "  👉 Abra: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap to kill backend when frontend exits
trap "kill $BACKEND_PID 2>/dev/null" EXIT

REACT_APP_API_URL=http://localhost:8000 npm start
