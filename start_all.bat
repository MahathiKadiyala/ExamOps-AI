@echo off
title ExamOps - Full Stack Launcher
cd /d "%~dp0"
echo ==========================================================
echo   ExamOps — AI-Powered Examination Operations
echo   Launching Backend (FastAPI :8000) and Frontend (Vite :5173)
echo ==========================================================
start "ExamOps Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "ExamOps Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both services started!
echo Frontend: http://localhost:5173
echo Backend API: http://127.0.0.1:8000/api/health
