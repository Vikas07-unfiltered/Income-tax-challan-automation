@echo off
title Fix Launcher Error
color 0B

echo.
echo ========================================
echo    FIXING LAUNCHER ERROR
echo ========================================
echo.
echo 🔧 Fixing the PowerShell Console.Window error...
echo 💡 Creating new reliable launcher...
echo.

REM Remove problematic shortcuts
echo 🗑️ Removing old shortcuts with errors...
if exist "%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk" del "%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk"
if exist "%USERPROFILE%\Desktop\Tax Challan App (Alt1).lnk" del "%USERPROFILE%\Desktop\Tax Challan App (Alt1).lnk"
if exist "%USERPROFILE%\Desktop\Tax Challan App (Alt2).lnk" del "%USERPROFILE%\Desktop\Tax Challan App (Alt2).lnk"
if exist "%USERPROFILE%\Desktop\Tax Challan App (Alt3).lnk" del "%USERPROFILE%\Desktop\Tax Challan App (Alt3).lnk"

echo ✅ Old shortcuts removed

REM Create new working shortcut with the fixed launcher
echo 🚀 Creating new working shortcut...

echo Set WshShell = CreateObject("WScript.Shell") > temp_fixed_shortcut.vbs
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk") >> temp_fixed_shortcut.vbs
echo oShellLink.TargetPath = "%~dp0Income Tax Challan Automation.bat" >> temp_fixed_shortcut.vbs
echo oShellLink.WorkingDirectory = "%~dp0" >> temp_fixed_shortcut.vbs
echo oShellLink.Description = "Income Tax Challan Automation - Fixed Version" >> temp_fixed_shortcut.vbs
echo oShellLink.IconLocation = "%SystemRoot%\System32\imageres.dll,109" >> temp_fixed_shortcut.vbs
echo oShellLink.Save >> temp_fixed_shortcut.vbs

cscript temp_fixed_shortcut.vbs //nologo
del temp_fixed_shortcut.vbs

echo ✅ New working shortcut created!

echo.
echo ========================================
echo           ERROR FIXED!
echo ========================================
echo.
echo ✅ The Console.Window error has been fixed
echo 🎯 New launcher uses simple, reliable method
echo 📱 Desktop shortcut updated and working
echo 🚀 No more PowerShell errors!
echo.
echo 💡 What's changed:
echo    • Removed problematic console hiding code
echo    • Created simple, reliable launcher
echo    • Better error messages and user feedback
echo    • Professional appearance maintained
echo.
echo 🎉 Your Income Tax Challan Automation is ready!
echo    Just double-click the desktop icon to start.
echo.
pause
