# Final Application-Style Shortcut Creator
Write-Host "🎯 Creating Professional Application Shortcut..." -ForegroundColor Green

# Paths
$currentDir = Get-Location
$batchPath = Join-Path $currentDir "Income Tax Challan Automation.bat"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"

# Remove old shortcut
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "🗑️ Removed old shortcut" -ForegroundColor Yellow
}

# Create professional shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $batchPath
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.Description = "Income Tax Challan Automation - Professional Web Application"

# Use professional application icon
$Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll,1"  # Professional app icon

$Shortcut.Save()

Write-Host "✅ Professional application shortcut created!" -ForegroundColor Green
Write-Host "📱 Icon: Professional application style (not folder)" -ForegroundColor Cyan
Write-Host "🎯 Location: Desktop" -ForegroundColor Yellow

Write-Host ""
Write-Host "🚀 Features:" -ForegroundColor Green
Write-Host "   • Professional app icon (not folder)" -ForegroundColor White
Write-Host "   • Silent server startup" -ForegroundColor White
Write-Host "   • Automatic browser opening" -ForegroundColor White
Write-Host "   • No command windows stay open" -ForegroundColor White
Write-Host ""
Write-Host "✨ Your application is ready to use!" -ForegroundColor Green
