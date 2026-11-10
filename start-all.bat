@echo off
echo =====================================================================
echo  ShaadiSnap AI - Wedding Photo Discovery Platform (Port 3000)
echo =====================================================================
echo Launching ShaadiSnap AI Web Platform...
cd /d "%~dp0\shaadisnap-web"
call npm run dev -- -p 3000
