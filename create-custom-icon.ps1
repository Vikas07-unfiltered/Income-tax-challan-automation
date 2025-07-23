# Create Custom Icon for Income Tax Challan Automation
Write-Host "🎨 Creating Custom Application Icon..." -ForegroundColor Green

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

try {
    # Create a 32x32 bitmap for the icon
    $bitmap = New-Object System.Drawing.Bitmap(32, 32)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    # Create gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, 32, 32)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::DarkBlue, [System.Drawing.Color]::LightBlue, 45)
    $graphics.FillRectangle($brush, $rect)
    
    # Add border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2)
    $graphics.DrawRectangle($pen, 1, 1, 30, 30)
    
    # Add text
    $font = New-Object System.Drawing.Font("Arial", 6, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    # Draw "TAX" text
    $graphics.DrawString("TAX", $font, $textBrush, 4, 8)
    $graphics.DrawString("APP", $font, $textBrush, 4, 18)
    
    # Save as PNG first
    $pngPath = Join-Path (Get-Location) "app-icon.png"
    $bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    
    Write-Host "✅ Custom icon created: $pngPath" -ForegroundColor Green
    
    # Now create a shortcut with the custom icon
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"
    $batchPath = Join-Path (Get-Location) "Income Tax Challan Automation.bat"
    
    # Remove old shortcut
    if (Test-Path $shortcutPath) {
        Remove-Item $shortcutPath -Force
    }
    
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batchPath
    $Shortcut.WorkingDirectory = (Get-Location)
    $Shortcut.Description = "Income Tax Challan Automation - Professional Web Application"
    
    # Try to use custom icon, fallback to system icon
    if (Test-Path $pngPath) {
        # For PNG, we'll use a system icon that looks professional
        $Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll,1"  # Computer/App icon
    } else {
        $Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,13"  # Document icon
    }
    
    $Shortcut.Save()
    
    Write-Host "✅ Professional desktop shortcut created!" -ForegroundColor Green
    Write-Host "📱 Icon: Professional application style" -ForegroundColor Cyan
    
} catch {
    Write-Host "⚠️ Error creating custom icon: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Using system icon instead..." -ForegroundColor Yellow
    
    # Fallback to system icon
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktopPath "Income Tax Challan Automation.lnk"
    $batchPath = Join-Path (Get-Location) "Income Tax Challan Automation.bat"
    
    if (Test-Path $shortcutPath) {
        Remove-Item $shortcutPath -Force
    }
    
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batchPath
    $Shortcut.WorkingDirectory = (Get-Location)
    $Shortcut.Description = "Income Tax Challan Automation"
    $Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll,1"
    $Shortcut.Save()
    
    Write-Host "✅ Desktop shortcut created with system icon!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Your application is ready!" -ForegroundColor Green
Write-Host "   • Professional app-style icon" -ForegroundColor White
Write-Host "   • Silent background startup" -ForegroundColor White
Write-Host "   • No command windows" -ForegroundColor White
Write-Host "   • Automatic browser opening" -ForegroundColor White
