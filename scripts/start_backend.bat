@echo off
echo ===================================================
echo   STARTING FOOD RESCUE NODE.JS EXPRESS BACKEND
echo ===================================================
cd /d "%~dp0\..\backend"

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo Starting Express server on port 5000...
node server.js
pause
