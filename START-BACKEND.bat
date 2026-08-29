@echo off
title Cashio Expense Tracker - Backend Server
cd /d "%~dp0\backend"
echo ==============================================
echo   Starting Cashio Backend on http://localhost:5000
echo ==============================================
npm run dev
pause
