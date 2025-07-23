@echo off
title Test Launcher
color 0A

echo.
echo ========================================
echo      TESTING FIXED LAUNCHER
echo ========================================
echo.
echo 🧪 Testing the fixed PowerShell launcher...
echo.

REM Test the simple launcher directly
echo 🚀 Running simple-launcher.ps1...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0simple-launcher.ps1"

echo.
echo ========================================
echo        TEST COMPLETED
echo ========================================
echo.
echo 💡 If the test worked:
echo    • Browser opened to http://localhost:3001
echo    • No PowerShell errors appeared
echo    • Application is now running
echo.
echo 🎯 Your desktop icon should now work perfectly!
echo.
pause
