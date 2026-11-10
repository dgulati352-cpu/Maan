@echo off
echo =====================================================================
echo  ShaadiSnap AI - Facial Recognition & Discovery Backend Microservice
echo  Port: 8001 ^| Framework: FastAPI + ArcFace 512-d ^| Python 3.11
echo =====================================================================
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo Starting FastAPI Uvicorn Server on http://0.0.0.0:8001...
"%PYTHON_EXE%" -m uvicorn api.main:app --host 0.0.0.0 --port 8001 --log-level info
pause

