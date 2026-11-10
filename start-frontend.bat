@echo off
echo =====================================================================
echo  ShaadiSnap AI - Starting Frontend Client (Port 3000)
echo =====================================================================
cd /d "%~dp0\frontend"
call npm run dev -- -p 3000
pause

