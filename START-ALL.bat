@echo off
title Flow Expense Tracker Launcher
echo ==============================================
echo   Starting Flow Full Stack Application
echo ==============================================
start "Flow Backend (Port 5000)" cmd /k "cd /d %~dp0\backend && npm run dev"
start "Flow Frontend (Port 5173)" cmd /k "cd /d %~dp0\frontend && npm run dev"
echo Both servers are starting in separate windows.
timeout /t 3
