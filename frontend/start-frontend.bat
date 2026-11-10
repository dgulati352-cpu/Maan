@echo off
echo =====================================================================
echo  ShaadiSnap AI - Frontend Application (Port 3000)
echo =====================================================================
cd /d "%~dp0"
call npm run dev -- -p 3000
pause

