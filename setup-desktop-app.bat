@echo off
title Income Tax Challan Automation - Desktop Setup
color 0B

echo.
echo ============================================================
echo           INCOME TAX CHALLAN AUTOMATION
echo                  DESKTOP SETUP
echo ============================================================
echo.
echo 🚀 Setting up your desktop application...
echo.

cd /d "%~dp0"

REM Check Node.js
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo After installation, run this setup again.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
if not exist "node_modules" (
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)

REM Create desktop shortcut using PowerShell
echo.
echo 🖥️  Creating desktop shortcut...
powershell -ExecutionPolicy Bypass -File "create-desktop-shortcut.ps1"

echo.
echo ============================================================
echo                    SETUP COMPLETE!
echo ============================================================
echo.
echo 🎉 Your Income Tax Challan Automation is ready!
echo.
echo 📍 What's been created:
echo    ✅ Desktop shortcut
echo    ✅ Start Menu shortcut (if possible)
echo    ✅ All dependencies installed
echo.
echo 🎯 How to use:
echo    1. Double-click the desktop icon
echo    2. Server starts automatically
echo    3. Browser opens to the web interface
echo    4. Start processing your tax challans!
echo.
echo 💡 Features available:
echo    • Download Excel template
echo    • Upload and process multiple rows
echo    • Real-time progress tracking
echo    • Download results (Excel, PDFs, Reports)
echo.
echo 🏢 Share with your team:
echo    When the app is running, others can access it at:
echo    http://[your-computer-ip]:3001
echo.
echo ============================================================
echo.

REM Ask if user wants to start the app now
set /p choice="Would you like to start the application now? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo 🚀 Starting Income Tax Challan Automation...
    echo.
    start "" "%~dp0start-local-server.bat"
) else (
    echo.
    echo 👍 You can start the app anytime by double-clicking the desktop icon!
)

echo.
echo Press any key to close this setup window...
pause >nul
