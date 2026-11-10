@echo off
echo =====================================================================
echo  ShaadiSnap AI - Standalone Backend API Server (Port 5000)
echo =====================================================================
cd /d "%~dp0"
call npx tsx src/server.ts
pause

