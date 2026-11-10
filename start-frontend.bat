@echo off
echo =====================================================================
echo  ShaadiSnap AI - Web & Admin Application (Port 3000)
echo =====================================================================
cd /d "%~dp0\shaadisnap-web"
call npm run dev -- -p 3000
pause
