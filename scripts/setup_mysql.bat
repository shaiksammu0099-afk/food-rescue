@echo off
echo ===================================================
echo   INITIALIZING FOOD RESCUE MYSQL DATABASE
echo ===================================================
set /p DB_USER="Enter MySQL Username [default: root]: " || set DB_USER=root
if "%DB_USER%"=="" set DB_USER=root

echo Running schema.sql...
mysql -u %DB_USER% -p < "%~dp0\..\database\schema.sql"

echo Running seed.sql...
mysql -u %DB_USER% -p < "%~dp0\..\database\seed.sql"

echo Database initialization complete!
pause
