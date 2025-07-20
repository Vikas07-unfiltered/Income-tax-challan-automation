# 🖥️ Desktop Application Guide
## Income Tax Challan Automation

### 🚀 **One-Click Setup**

**Run this file to set everything up:**
```
📁 setup-desktop-app.bat
```

This will:
- ✅ Check Node.js installation
- ✅ Install all dependencies
- ✅ Create desktop shortcut
- ✅ Create Start Menu shortcut
- ✅ Ready to use!

---

### 🎯 **How to Use**

**1. Double-click the desktop icon:**
```
🖥️ "Income Tax Challan Automation" (on your desktop)
```

**2. What happens automatically:**
- 🔧 Server starts on localhost:3001
- 🌐 Browser opens automatically
- 📱 Web interface loads
- 🎉 Ready to process challans!

**3. Use the web interface:**
- 📥 **Download Excel Template**
- 📤 **Upload your filled Excel file**
- 👀 **Watch real-time progress**
- 📊 **Download results**

---

### 📁 **Files Created**

| File | Purpose |
|------|---------|
| `setup-desktop-app.bat` | One-time setup |
| `Income Tax Challan Automation.bat` | Main launcher |
| `launch-app.js` | Smart launcher script |
| `create-desktop-shortcut.ps1` | Shortcut creator |

---

### 🏢 **Share with Your Team**

**When your app is running, others can access it:**
```
http://[your-computer-ip]:3001
```

**To find your IP address:**
```cmd
ipconfig
```
Look for "IPv4 Address" (usually starts with 192.168.x.x)

---

### 🔧 **Troubleshooting**

**Problem: Desktop icon doesn't work**
- Solution: Run `setup-desktop-app.bat` again

**Problem: Browser doesn't open**
- Solution: Manually go to `http://localhost:3001`

**Problem: Server won't start**
- Solution: Check if port 3001 is free
- Run: `netstat -ano | findstr :3001`

**Problem: Node.js not found**
- Solution: Install Node.js from https://nodejs.org
- Restart computer after installation

---

### 💡 **Pro Tips**

**1. Pin to Taskbar:**
- Right-click desktop shortcut → "Pin to taskbar"

**2. Create Multiple Shortcuts:**
- Copy the desktop shortcut anywhere you want

**3. Auto-start with Windows:**
- Copy shortcut to: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`

**4. Share Template:**
- Send colleagues the template download link
- They can fill it and email back to you

---

### 🎉 **Features Available**

✅ **Template Management**
- Download Excel template
- Pre-formatted with all required columns
- Sample data included

✅ **Batch Processing**
- Process multiple companies at once
- Real-time progress tracking
- Error handling and recovery

✅ **Results Management**
- Updated Excel with challan details
- ZIP file with all PDFs
- Detailed processing report

✅ **User-Friendly Interface**
- Modern, responsive design
- Drag & drop file upload
- Live status updates

---

### 🔒 **Security & Privacy**

- ✅ **Runs locally** - No data sent to external servers
- ✅ **Your credentials** stay on your computer
- ✅ **Generated PDFs** saved locally
- ✅ **Complete control** over your data

---

### 📞 **Support**

**If you need help:**
1. Check this guide first
2. Try running setup again
3. Restart your computer
4. Check Windows Event Viewer for errors

**Your app is ready to automate income tax challan processing! 🚀**
