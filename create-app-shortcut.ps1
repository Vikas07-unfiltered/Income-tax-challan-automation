# Create Application-Style Desktop Shortcut
Write-Host "🚀 Creating Application-Style Desktop Shortcut..." -ForegroundColor Green

# Get paths
$currentDir = Get-Location
$vbsFile = Join-Path $currentDir "Income Tax Challan Automation.vbs"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"

# Remove old shortcut if exists
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "🗑️ Removed old shortcut" -ForegroundColor Yellow
}

# Create WScript Shell object
$WshShell = New-Object -comObject WScript.Shell

# Create shortcut pointing to VBS file
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $vbsFile
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.Description = "Income Tax Challan Automation - Local Web Application"
$Shortcut.WindowStyle = 1

# Set application icon (use a proper app icon)
$iconPaths = @(
    "$env:SystemRoot\System32\imageres.dll,3",    # Globe/Web icon
    "$env:SystemRoot\System32\shell32.dll,13",    # Document icon
    "$env:SystemRoot\System32\shell32.dll,1",     # File icon
    "$env:SystemRoot\System32\wmploc.dll,0"       # Media icon
)

foreach ($iconPath in $iconPaths) {
    $iconFile = $iconPath.Split(',')[0]
    if (Test-Path $iconFile) {
        $Shortcut.IconLocation = $iconPath
        Write-Host "📱 Using icon: $iconPath" -ForegroundColor Cyan
        break
    }
}

# Save shortcut
$Shortcut.Save()

Write-Host "✅ Application-style desktop shortcut created!" -ForegroundColor Green
Write-Host "📍 Location: $shortcutPath" -ForegroundColor Yellow

# Also create Start Menu shortcut
$startMenuPath = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$startMenuShortcut = Join-Path $startMenuPath "Income Tax Challan Automation.lnk"

try {
    $StartShortcut = $WshShell.CreateShortcut($startMenuShortcut)
    $StartShortcut.TargetPath = $vbsFile
    $StartShortcut.WorkingDirectory = $currentDir
    $StartShortcut.Description = "Income Tax Challan Automation - Local Web Application"
    $StartShortcut.WindowStyle = 1
    $StartShortcut.IconLocation = $Shortcut.IconLocation
    $StartShortcut.Save()
    Write-Host "✅ Start Menu shortcut also created!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not create Start Menu shortcut" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 How to use:" -ForegroundColor Cyan
Write-Host "   • Double-click the desktop icon" -ForegroundColor White
Write-Host "   • VBS script will start the server silently" -ForegroundColor White
Write-Host "   • Browser will open automatically" -ForegroundColor White
Write-Host "   • No command window will stay open" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your app-style shortcut is ready!" -ForegroundColor Green

# Test the shortcut
$response = Read-Host "Would you like to test the shortcut now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "🚀 Testing shortcut..." -ForegroundColor Green
    Start-Process $shortcutPath
}
