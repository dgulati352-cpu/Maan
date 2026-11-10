@echo off
echo =====================================================================
echo  ShaadiSnap AI - Master Launcher (Frontend + Backend + ML Engine)
echo =====================================================================
echo 1. Launching Python ML Face Recognition Backend (Port 8001)...
start "ShaadiSnap ML Backend (Port 8001)" cmd /c "cd /d "%~dp0\shaadisnap-ml" && start-backend.bat"

echo 2. Launching Standalone Node.js REST API Backend (Port 5000)...
start "ShaadiSnap API Backend (Port 5000)" cmd /c "cd /d "%~dp0\backend" && npx tsx src/server.ts"

echo 3. Launching Next.js Frontend UI Client (Port 3000)...
start "ShaadiSnap Frontend (Port 3000)" cmd /c "cd /d "%~dp0\frontend" && npm run dev -- -p 3000"

echo.
echo =====================================================================
echo  ShaadiSnap AI Architecture is running:
echo  - Frontend Client:        http://localhost:3000
echo  - Admin Photo Manager:    http://localhost:3000/admin/photos
echo  - REST API Backend:       http://localhost:5000
echo  - Backend Health:         http://localhost:5000/api/health
echo  - ML Backend API Docs:    http://localhost:8001/docs
echo  - ML Backend Health:      http://localhost:8001/health
echo =====================================================================
timeout /t 5
