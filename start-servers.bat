@echo off
echo ====================================
echo Starting Event Management Platform
echo ====================================
echo.

REM Start backend in a new window
start "Backend Server" cmd /k "cd /d %~dp0 && C:/Users/mouhib/Downloads/event-management-platform/.venv/Scripts/python.exe backend/app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ====================================
echo Both servers are starting!
echo ====================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop both servers...
pause >nul

REM Kill both servers when user presses a key
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /T /F >nul 2>&1

echo.
echo Servers stopped.
