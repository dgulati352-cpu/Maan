@echo off
echo =====================================================================
echo  ShaadiSnap AI - Starting Backend Services
echo =====================================================================
echo 1. Launching Python ML Face Recognition Service (Port 8001)...
start "ShaadiSnap ML Backend (Port 8001)" cmd /c "cd /d "%~dp0\shaadisnap-ml" && start-backend.bat"

echo 2. Launching Standalone Node.js API Backend (Port 5000)...
start "ShaadiSnap API Backend (Port 5000)" cmd /c "cd /d "%~dp0\backend" && npx tsx src/server.ts"

echo.
echo =====================================================================
echo  Backend Services are launching:
echo  - REST API Backend:       http://localhost:5000
echo  - Backend Health:         http://localhost:5000/api/health
echo  - ML Microservice:        http://localhost:8001
echo  - ML Swagger API Docs:    http://localhost:8001/docs
echo =====================================================================
timeout /t 5
