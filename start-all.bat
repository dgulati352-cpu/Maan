@echo off
echo =====================================================================
echo  ShaadiSnap AI - Master Launcher (Frontend + Admin + Backend)
echo =====================================================================
echo 1. Launching FastAPI Face Recognition Backend (Port 8001)...
start "ShaadiSnap Backend (Port 8001)" cmd /c "cd /d "%~dp0\shaadisnap-ml" && start-backend.bat"

echo 2. Launching Next.js Web ^& Admin Dashboard (Port 3000)...
start "ShaadiSnap Frontend (Port 3000)" cmd /c "cd /d "%~dp0\shaadisnap-web" && npm run start -- -p 3000"

echo.
echo =====================================================================
echo  ShaadiSnap AI is now running:
echo  - Web ^& Guest Gallery:       http://localhost:3000
echo  - Admin Photo Manager:       http://localhost:3000/admin/photos
echo  - ML Backend API Docs:       http://localhost:8001/docs
echo  - ML Backend Health:         http://localhost:8001/health
echo =====================================================================
timeout /t 5

