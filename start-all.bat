@echo off
echo =====================================================================
echo  ShaadiSnap AI - Application Launcher (Direct Access - No Login)
echo =====================================================================
echo 1. Launching Python ML Face Recognition Engine (Port 8001)...
start "ShaadiSnap ML (Port 8001)" cmd /c "cd /d "%~dp0\shaadisnap-ml" && start-backend.bat"

echo 2. Launching ShaadiSnap AI Web & Admin Platform (Port 3000)...
start "ShaadiSnap AI (Port 3000)" cmd /c "cd /d "%~dp0\shaadisnap-web" && npm run dev -- -p 3000"

echo.
echo =====================================================================
echo  ShaadiSnap AI is now running:
echo  - Main Website & Gallery:   http://localhost:3000
echo  - Admin Studio (No Login):  http://localhost:3000/admin
echo  - Photo Operations Hub:     http://localhost:3000/admin/photos
echo  - ML Biometric Docs:        http://localhost:8001/docs
echo =====================================================================
timeout /t 5
