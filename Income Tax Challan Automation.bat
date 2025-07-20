@echo off
title Income Tax Challan Automation
color 0A

echo.
echo ========================================
echo   INCOME TAX CHALLAN AUTOMATION
echo ========================================
echo.
echo 🚀 Starting application...
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the application
echo 🔧 Starting server and opening browser...
node launch-app.js

pause
