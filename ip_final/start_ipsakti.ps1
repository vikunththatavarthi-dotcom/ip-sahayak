Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  IP-SAKTI Sahayak: AI Patent & Legal Intelligence System" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Ollama
Write-Host "[1/3] Checking Ollama AI Service..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2
    Write-Host "[OLLAMA] Ollama is active on http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "[OLLAMA] Starting local Ollama server in background..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# 2. Start Backend
Write-Host "[2/3] Launching FastAPI Backend (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 3. Start Frontend
Write-Host "[3/3] Launching Next.js Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  All systems launched!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Ollama:   http://localhost:11434" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
