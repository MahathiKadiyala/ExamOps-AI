@echo off
title ExamOps - FastAPI Backend & Operations Agent
cd /d "%~dp0backend"
echo =======================================================
echo   ExamOps — AI-Powered Examination Operations
echo   FastAPI + SQLite + 10-Rule Conflict Engine + AI Agent
echo =======================================================
echo Starting backend on http://127.0.0.1:8000 ...
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
