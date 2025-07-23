# Simple PowerShell script to create desktop shortcut
Write-Host "Creating Desktop Shortcut..." -ForegroundColor Green

# Get paths
$currentDir = Get-Location
$batchFile = Join-Path $currentDir "start-local-server.bat"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"

# Create shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $batchFile
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.Description = "Income Tax Challan Automation - Local Server"
$Shortcut.WindowStyle = 1

# Set icon
$iconPath = "$env:SystemRoot\System32\imageres.dll"
if (Test-Path $iconPath) {
    $Shortcut.IconLocation = "$iconPath,3"
}

# Save shortcut
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $shortcutPath" -ForegroundColor Yellow
