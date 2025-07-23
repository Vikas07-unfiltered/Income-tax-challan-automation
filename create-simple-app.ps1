# Simple Application Shortcut Creator
Write-Host "Creating App-Style Shortcut..." -ForegroundColor Green

$currentDir = Get-Location
$vbsFile = Join-Path $currentDir "Income Tax Challan Automation.vbs"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"

# Remove old shortcut
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
}

# Create shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $vbsFile
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.Description = "Income Tax Challan Automation"

# Set web application icon
$Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll,3"

$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
