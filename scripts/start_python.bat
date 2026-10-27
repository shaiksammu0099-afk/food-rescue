@echo off
echo ===================================================
echo   STARTING FOOD RESCUE PYTHON AI MICROSERVICE
echo ===================================================
cd /d "%~dp0\..\python_ai_service"

echo Installing Python AI requirements (if needed)...
pip install -r requirements.txt

echo Starting Python Flask AI Microservice on port 5001...
python app.py
pause
