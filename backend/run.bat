@echo off
title Klyra Backend
cd /d "%~dp0"
echo Starting Klyra FastAPI Backend on port 8000...
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
