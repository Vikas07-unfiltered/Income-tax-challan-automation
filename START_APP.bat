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

REM Change to the correct directory
cd /d "%~dp0"

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🌐 Starting web server...
echo.

REM Start the server
start /b node server.js

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo 🌍 Opening browser...
start http://localhost:3001

echo.
echo ========================================
echo        APPLICATION STARTED!
echo ========================================
echo.
echo ✅ Server is running on: http://localhost:3001
echo 🌍 Browser should open automatically
echo.
echo 💡 To stop the server: Press Ctrl+C
echo 🔄 To restart: Run this file again
echo.
echo 🎉 Your Income Tax Challan Automation is ready!
echo.

REM Keep window open to show server logs
echo 📊 Server logs (you can minimize this window):
echo.
node server.js
