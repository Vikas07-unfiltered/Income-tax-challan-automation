# Create EXE-style launcher for Income Tax Challan Automation
Write-Host "🚀 Creating EXE-style Application Launcher..." -ForegroundColor Green

# Create a PowerShell script that will be converted to EXE
$launcherScript = @'
# Income Tax Challan Automation Launcher
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Hide PowerShell console
$consolePtr = [Console.Window]::GetConsoleWindow()
[Console.Window]::ShowWindow($consolePtr, 0)

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Change to application directory
Set-Location $scriptDir

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) { throw "Node.js not found" }
} catch {
    [System.Windows.Forms.MessageBox]::Show("Node.js is not installed or not in PATH.`n`nPlease install Node.js from https://nodejs.org/", "Income Tax Challan Automation", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    exit
}

# Check dependencies
if (-not (Test-Path "node_modules")) {
    $result = [System.Windows.Forms.MessageBox]::Show("Installing dependencies...`n`nThis may take a few minutes.", "Income Tax Challan Automation", [System.Windows.Forms.MessageBoxButtons]::OKCancel, [System.Windows.Forms.MessageBoxIcon]::Information)
    if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
        Start-Process "npm" -ArgumentList "install" -Wait -WindowStyle Hidden
    }
}

# Start server
Start-Process "node" -ArgumentList "server.js" -WindowStyle Hidden

# Wait for server to start
Start-Sleep -Seconds 3

# Open browser
Start-Process "http://localhost:3001"

# Show success message
[System.Windows.Forms.MessageBox]::Show("🚀 Income Tax Challan Automation started successfully!`n`nWeb interface opened in your browser.`nServer: http://localhost:3001", "Success", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
'@

# Save the launcher script
$launcherPath = Join-Path (Get-Location) "launcher.ps1"
$launcherScript | Out-File -FilePath $launcherPath -Encoding UTF8

Write-Host "✅ Launcher script created: $launcherPath" -ForegroundColor Green

# Create a batch file that runs the PowerShell script hidden
$batchContent = @"
@echo off
powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0launcher.ps1"
"@

$batchPath = Join-Path (Get-Location) "Income Tax Challan Automation.bat"
$batchContent | Out-File -FilePath $batchPath -Encoding ASCII

Write-Host "✅ Batch launcher created: $batchPath" -ForegroundColor Green

# Create desktop shortcut to the batch file
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"

# Remove old shortcut
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
}

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $batchPath
$Shortcut.WorkingDirectory = (Get-Location)
$Shortcut.Description = "Income Tax Challan Automation - Web Application"
$Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll,3"  # Globe icon
$Shortcut.Save()

Write-Host "✅ Desktop shortcut created!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Features:" -ForegroundColor Cyan
Write-Host "   • No command window stays open" -ForegroundColor White
Write-Host "   • Silent background server startup" -ForegroundColor White
Write-Host "   • Automatic browser opening" -ForegroundColor White
Write-Host "   • Professional app-like behavior" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your application launcher is ready!" -ForegroundColor Green
