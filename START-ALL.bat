@echo off
title Cashio Expense Tracker Launcher
echo ==============================================
echo   Starting Cashio Full Stack Application
echo ==============================================
start "Cashio Backend (Port 5000)" cmd /k "cd /d %~dp0\backend && npm run dev"
start "Cashio Frontend (Port 5173)" cmd /k "cd /d %~dp0\frontend && npm run dev"
echo Both servers are starting in separate windows.
timeout /t 3
