@echo off
title IP-SAKTI Sahayak — Full Stack Launcher
color 0A

echo ============================================================
echo   IP-SAKTI Sahayak: AI Patent & Legal Intelligence System
echo ============================================================
echo.

echo [1/3] Checking Ollama AI Service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [OLLAMA] Starting local Ollama server in background...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
) else (
    echo [OLLAMA] Ollama is active on http://localhost:11434
)

echo.
echo [2/3] Launching FastAPI Backend (Port 8000)...
start "IP-SAKTI Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [3/3] Launching Next.js Frontend (Port 3000)...
start "IP-SAKTI Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo   All systems launched!
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://127.0.0.1:8000/docs
echo   - Ollama:   http://localhost:11434
echo ============================================================
echo.
pause
