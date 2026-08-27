@echo off
title Flow Expense Tracker - Backend Server
cd /d "%~dp0\backend"
echo ==============================================
echo   Starting Flow Backend on http://localhost:5000
echo ==============================================
npm run dev
pause
