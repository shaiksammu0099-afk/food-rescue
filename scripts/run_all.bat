@echo off
echo =====================================================================
echo              FOOD RESCUE FULL-STACK SUITE LAUNCHER
echo =====================================================================

echo 1. Launching Node.js Backend Server...
start "Food Rescue Backend" cmd /k "cd /d %~dp0\..\backend && node server.js"

echo 2. Launching Python AI Microservice...
start "Food Rescue AI Service" cmd /k "cd /d %~dp0\..\python_ai_service && python app.py"

echo 3. Opening Frontend in default web browser...
start "" "%~dp0\..\frontend\index.html"

echo All services dispatched! Check the opened terminal windows.
pause
