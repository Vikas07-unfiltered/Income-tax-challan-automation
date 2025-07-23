@echo off
title Income Tax Challan Automation - Local Server
color 0A

echo ========================================
echo  Income Tax Challan Automation Server
echo ========================================
echo.
echo Starting local web server...
echo.

REM Change to the project directory
cd /d "%~dp0"

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the server in the background
echo Starting server on http://localhost:3001...
start /b node server.js

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Open the website in default browser
echo Opening website in browser...
start http://localhost:3001

echo.
echo ========================================
echo  Server is running on http://localhost:3001
echo  Press Ctrl+C to stop the server
echo ========================================
echo.

REM Keep the window open to show server logs
node server.js
