@echo off
title VAYU - Solar Wind Energy Platform
color 0A
echo.
echo  ========================================
echo   VAYU - Solar Wind Energy Platform
echo  ========================================
echo.

:: ── Check Python ─────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ and retry.
    pause & exit /b 1
)

:: ── Check Node ───────────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install Node.js 18+ and retry.
    pause & exit /b 1
)

:: ── Start main Flask backend (port 5000) ─────────────────────────────────
echo  [1/3] Starting VAYU backend        (port 5000)...
start "VAYU Backend" cmd /k "cd /d "%~dp0vayu_backend" && python app.py"

:: ── Start chatbot server (port 5001) ─────────────────────────────────────
echo  [2/3] Starting VAYU AI Chatbot     (port 5001)...
start "VAYU Chatbot" cmd /k "cd /d "%~dp0" && python chatbot_server.py"

:: Wait for both backends
timeout /t 5 /nobreak >nul

:: ── Start React frontend (port 8080) ─────────────────────────────────────
echo  [3/3] Starting React frontend      (port 8080)...
if not exist "%~dp0solar-wind-energy-prediction\node_modules" (
    echo  Installing Node packages (first run)...
    cd /d "%~dp0solar-wind-energy-prediction" && npm install
)
start "VAYU Frontend" cmd /k "cd /d "%~dp0solar-wind-energy-prediction" && npm run dev"

timeout /t 5 /nobreak >nul

:: ── Open browser ─────────────────────────────────────────────────────────
echo.
echo  ========================================
echo   All services running!
echo.
echo   Frontend  : http://localhost:8080
echo   Backend   : http://localhost:5000
echo   AI Chat   : http://localhost:5001
echo.
echo   Click the lightning bolt (bottom-right)
echo   to open the AI chatbot.
echo  ========================================
echo.
start "" "http://localhost:8080"
echo  Press any key to stop all services...
pause >nul

taskkill /f /fi "WindowTitle eq VAYU Backend*"  >nul 2>&1
taskkill /f /fi "WindowTitle eq VAYU Chatbot*"  >nul 2>&1
taskkill /f /fi "WindowTitle eq VAYU Frontend*" >nul 2>&1
echo  All services stopped.
