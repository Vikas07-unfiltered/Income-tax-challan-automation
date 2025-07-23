# Income Tax Challan Automation Launcher
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Hide PowerShell console using correct Windows API
Add-Type -Name Window -Namespace Console -MemberDefinition '
[DllImport("Kernel32.dll")]
public static extern IntPtr GetConsoleWindow();

[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, Int32 nCmdShow);
'

try {
    $consolePtr = [Console.Window]::GetConsoleWindow()
    [Console.Window]::ShowWindow($consolePtr, 0)
} catch {
    # If hiding console fails, continue anyway
    Write-Host "Console hiding not available, continuing..."
}

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
[System.Windows.Forms.MessageBox]::Show("ðŸš€ Income Tax Challan Automation started successfully!`n`nWeb interface opened in your browser.`nServer: http://localhost:3001", "Success", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
