@echo off
echo Creating Professional Application Icon...

REM Create VBScript to make the shortcut
echo Set WshShell = CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk") >> temp_shortcut.vbs
echo oShellLink.TargetPath = "%~dp0Income Tax Challan Automation.bat" >> temp_shortcut.vbs
echo oShellLink.WorkingDirectory = "%~dp0" >> temp_shortcut.vbs
echo oShellLink.Description = "Income Tax Challan Automation - Web Application" >> temp_shortcut.vbs
echo oShellLink.IconLocation = "%SystemRoot%\System32\imageres.dll,1" >> temp_shortcut.vbs
echo oShellLink.Save >> temp_shortcut.vbs

REM Run the VBScript
cscript temp_shortcut.vbs //nologo

REM Clean up
del temp_shortcut.vbs

echo.
echo ✅ Professional application icon created on desktop!
echo 📱 Icon: Application style (not folder)
echo 🎯 Double-click to start your Income Tax Challan Automation
echo.
pause
