@echo off
title Professional Icon Creator
color 0B

echo.
echo ========================================
echo    CREATING PROFESSIONAL ICON
echo ========================================
echo.
echo 🎨 Fixing the black icon issue...
echo 💼 Creating professional application icon...
echo.

REM Remove old shortcut first
if exist "%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk" (
    del "%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk"
    echo 🗑️ Removed old shortcut
)

REM Create VBScript to make professional shortcut
echo Creating professional shortcut script...

echo Set WshShell = CreateObject("WScript.Shell") > temp_professional_shortcut.vbs
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Income Tax Challan Automation.lnk") >> temp_professional_shortcut.vbs
echo oShellLink.TargetPath = "%~dp0Income Tax Challan Automation.bat" >> temp_professional_shortcut.vbs
echo oShellLink.WorkingDirectory = "%~dp0" >> temp_professional_shortcut.vbs
echo oShellLink.Description = "Income Tax Challan Automation - Professional Web Application" >> temp_professional_shortcut.vbs

REM Try different professional icons in order of preference
echo oShellLink.IconLocation = "%SystemRoot%\System32\imageres.dll,109" >> temp_professional_shortcut.vbs

echo oShellLink.Save >> temp_professional_shortcut.vbs

REM Run the VBScript
echo 🚀 Creating shortcut with professional icon...
cscript temp_professional_shortcut.vbs //nologo

REM Clean up
del temp_professional_shortcut.vbs

echo.
echo ✅ Professional icon created successfully!
echo 📱 Icon: Blue document/application icon
echo 🎯 Location: Desktop
echo.

REM Also try alternative icons if the first one doesn't work
echo Creating backup shortcuts with different professional icons...

REM Create alternative 1 - Calculator/App icon
echo Set WshShell = CreateObject("WScript.Shell") > temp_alt1.vbs
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Tax Challan App (Alt1).lnk") >> temp_alt1.vbs
echo oShellLink.TargetPath = "%~dp0Income Tax Challan Automation.bat" >> temp_alt1.vbs
echo oShellLink.WorkingDirectory = "%~dp0" >> temp_alt1.vbs
echo oShellLink.Description = "Income Tax Challan Automation" >> temp_alt1.vbs
echo oShellLink.IconLocation = "%SystemRoot%\System32\calc.exe,0" >> temp_alt1.vbs
echo oShellLink.Save >> temp_alt1.vbs
cscript temp_alt1.vbs //nologo
del temp_alt1.vbs

REM Create alternative 2 - Web/Globe icon
echo Set WshShell = CreateObject("WScript.Shell") > temp_alt2.vbs
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Tax Challan App (Alt2).lnk") >> temp_alt2.vbs
echo oShellLink.TargetPath = "%~dp0Income Tax Challan Automation.bat" >> temp_alt2.vbs
echo oShellLink.WorkingDirectory = "%~dp0" >> temp_alt2.vbs
echo oShellLink.Description = "Income Tax Challan Automation" >> temp_alt2.vbs
echo oShellLink.IconLocation = "%SystemRoot%\System32\imageres.dll,13" >> temp_alt2.vbs
echo oShellLink.Save >> temp_alt2.vbs
cscript temp_alt2.vbs //nologo
del temp_alt2.vbs

REM Create alternative 3 - Settings/Gear icon
echo Set WshShell = CreateObject("WScript.Shell") > temp_alt3.vbs
echo Set oShellLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Tax Challan App (Alt3).lnk") >> temp_alt3.vbs
echo oShellLink.TargetPath = "%~dp0Income Tax Challan Automation.bat" >> temp_alt3.vbs
echo oShellLink.WorkingDirectory = "%~dp0" >> temp_alt3.vbs
echo oShellLink.Description = "Income Tax Challan Automation" >> temp_alt3.vbs
echo oShellLink.IconLocation = "%SystemRoot%\System32\imageres.dll,114" >> temp_alt3.vbs
echo oShellLink.Save >> temp_alt3.vbs
cscript temp_alt3.vbs //nologo
del temp_alt3.vbs

echo.
echo 🎨 Multiple professional icons created:
echo    • Main: "Income Tax Challan Automation" (Blue document icon)
echo    • Alt1: "Tax Challan App (Alt1)" (Calculator icon)
echo    • Alt2: "Tax Challan App (Alt2)" (Globe/Web icon)
echo    • Alt3: "Tax Challan App (Alt3)" (Settings/Gear icon)
echo.
echo 💡 Choose the icon you like best and delete the others!
echo 🎯 All icons do the same thing - start your application
echo.
echo ✨ No more black icon! Professional look achieved!
echo.
pause
