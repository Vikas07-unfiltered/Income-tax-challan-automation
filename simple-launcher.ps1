# Simple Income Tax Challan Automation Launcher
# This version avoids console hiding issues

Add-Type -AssemblyName System.Windows.Forms

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "🚀 Starting Income Tax Challan Automation..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) { 
        throw "Node.js not found" 
    }
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    [System.Windows.Forms.MessageBox]::Show("Node.js is not installed or not in PATH.`n`nPlease install Node.js from https://nodejs.org/", "Income Tax Challan Automation", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    Read-Host "Press Enter to exit"
    exit
}

# Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    $result = [System.Windows.Forms.MessageBox]::Show("Installing dependencies...`n`nThis may take a few minutes. Click OK to continue.", "Income Tax Challan Automation", [System.Windows.Forms.MessageBoxButtons]::OKCancel, [System.Windows.Forms.MessageBoxIcon]::Information)
    if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit
        }
    } else {
        Write-Host "❌ Installation cancelled" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Start server
Write-Host "🌐 Starting web server..." -ForegroundColor Cyan
Start-Process "node" -ArgumentList "server.js" -WindowStyle Hidden

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

# Open browser
Write-Host "🌍 Opening web browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3001"

# Show success message
Write-Host "✅ Application started successfully!" -ForegroundColor Green
Write-Host "🎯 Web interface: http://localhost:3001" -ForegroundColor Cyan

[System.Windows.Forms.MessageBox]::Show("🚀 Income Tax Challan Automation started successfully!`n`nWeb interface opened in your browser.`nServer: http://localhost:3001`n`nYou can close this window now.", "Success", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)

Write-Host ""
Write-Host "✨ You can close this window now. The server is running in the background." -ForegroundColor Green
Write-Host "🔄 To restart, just double-click the desktop icon again." -ForegroundColor Cyan
