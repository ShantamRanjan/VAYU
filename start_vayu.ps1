$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend  = Join-Path $root "vayu_backend"
$frontend = Join-Path $root "solar-wind-energy-prediction"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   VAYU - Solar Wind Energy Platform" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# Install backend deps
Write-Host "  [1/3] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r "$backend\requirements.txt" -q

# Start Flask backend
Write-Host "  [2/3] Starting VAYU backend on port 5000..." -ForegroundColor Yellow
$backendProc = Start-Process python -ArgumentList "$backend\app.py" `
    -WorkingDirectory $backend -PassThru -WindowStyle Normal
Start-Sleep -Seconds 4

# Install frontend deps if needed
if (-not (Test-Path "$frontend\node_modules")) {
    Write-Host "  Installing Node packages (first run)..." -ForegroundColor Yellow
    & npm install --prefix $frontend
}

# Start React frontend
Write-Host "  [3/3] Starting React frontend on port 8080..." -ForegroundColor Yellow
$frontendProc = Start-Process npm -ArgumentList "run dev" `
    -WorkingDirectory $frontend -PassThru -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "   Both services running!" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend : http://localhost:8080" -ForegroundColor White
Write-Host "   Backend  : http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "   AI Chatbot: click ⚡ bottom-right corner" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""

# Open browser
Start-Process "http://localhost:8080"

Write-Host "  Press Enter to stop all services..." -ForegroundColor Gray
Read-Host

# Stop both processes
if ($backendProc -and -not $backendProc.HasExited)  { Stop-Process -Id $backendProc.Id  -Force }
if ($frontendProc -and -not $frontendProc.HasExited) { Stop-Process -Id $frontendProc.Id -Force }
Write-Host "  All services stopped." -ForegroundColor Red
