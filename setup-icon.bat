@echo off
echo Creating custom icon for Income Tax Challan Automation...

REM Create a simple icon using PowerShell (creates a .ico file)
powershell -Command "Add-Type -AssemblyName System.Drawing; $bitmap = New-Object System.Drawing.Bitmap(32, 32); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.Clear([System.Drawing.Color]::DarkBlue); $font = New-Object System.Drawing.Font('Arial', 8, [System.Drawing.FontStyle]::Bold); $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White); $graphics.DrawString('TAX', $font, $brush, 2, 8); $graphics.DrawString('APP', $font, $brush, 2, 18); $graphics.Dispose(); $bitmap.Save('%~dp0app-icon.png', [System.Drawing.Imaging.ImageFormat]::Png); $bitmap.Dispose()"

echo Icon created successfully!
pause
