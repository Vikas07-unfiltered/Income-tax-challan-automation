# PowerShell script to create desktop shortcut
# Income Tax Challan Automation - Desktop Shortcut Creator

Write-Host "🚀 Creating Desktop Shortcut for Income Tax Challan Automation..." -ForegroundColor Green

# Get current directory
$currentDir = Get-Location
$batchFile = Join-Path $currentDir "Income Tax Challan Automation.bat"

# Desktop path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"

# Create WScript Shell object
$WshShell = New-Object -comObject WScript.Shell

# Create shortcut
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $batchFile
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.Description = "Income Tax Challan Automation - Company Portal"
$Shortcut.WindowStyle = 1  # Normal window

# Try to set an icon (using system calculator icon as fallback)
$iconPath = "$env:SystemRoot\System32\calc.exe"
if (Test-Path $iconPath) {
    $Shortcut.IconLocation = "$iconPath,0"
}

# Save shortcut
$Shortcut.Save()

Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "📍 Location: $shortcutPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 You can now:" -ForegroundColor Cyan
Write-Host "   • Double-click the desktop icon to start the app" -ForegroundColor White
Write-Host "   • The server will start automatically" -ForegroundColor White
Write-Host "   • Your browser will open to the web interface" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Pin the shortcut to taskbar for even quicker access!" -ForegroundColor Yellow

# Also create a Start Menu shortcut
$startMenuPath = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$startMenuShortcut = Join-Path $startMenuPath "Income Tax Challan Automation.lnk"

try {
    $StartShortcut = $WshShell.CreateShortcut($startMenuShortcut)
    $StartShortcut.TargetPath = $batchFile
    $StartShortcut.WorkingDirectory = $currentDir
    $StartShortcut.Description = "Income Tax Challan Automation - Company Portal"
    $StartShortcut.WindowStyle = 1
    if (Test-Path $iconPath) {
        $StartShortcut.IconLocation = "$iconPath,0"
    }
    $StartShortcut.Save()
    Write-Host "✅ Start Menu shortcut also created!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not create Start Menu shortcut (may need admin rights)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup Complete! Your Income Tax Challan Automation is ready to use!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to test the shortcut
$response = Read-Host "Would you like to test the shortcut now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "🚀 Starting application..." -ForegroundColor Green
    Start-Process $shortcutPath
}
