@echo off
echo Creating working desktop shortcut...

REM Remove any old shortcuts
if exist "%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk" del "%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk"
if exist "%USERPROFILE%\Desktop\Tax Challan App*.lnk" del "%USERPROFILE%\Desktop\Tax Challan App*.lnk"

REM Create a simple, working shortcut
echo Set WshShell = CreateObject("WScript.Shell") > create_shortcut.vbs
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk") >> create_shortcut.vbs
echo oShellLink.TargetPath = "%~dp0START_APP.bat" >> create_shortcut.vbs
echo oShellLink.WorkingDirectory = "%~dp0" >> create_shortcut.vbs
echo oShellLink.Description = "Income Tax Challan Automation - Simple Launcher" >> create_shortcut.vbs
echo oShellLink.IconLocation = "%SystemRoot%\System32\calc.exe,0" >> create_shortcut.vbs
echo oShellLink.Save >> create_shortcut.vbs

cscript create_shortcut.vbs //nologo
del create_shortcut.vbs

echo.
echo ✅ Working desktop shortcut created!
echo 📱 Icon: Calculator (professional look)
echo 🎯 Target: START_APP.bat (simple and reliable)
echo.
echo 💡 Test it now: Double-click the desktop icon
echo.
pause
