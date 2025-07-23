' Income Tax Challan Automation Launcher
' This VBS script starts the local server and opens the web interface

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Change to the application directory
objShell.CurrentDirectory = strScriptPath

' Check if Node.js is available
On Error Resume Next
objShell.Run "node --version", 0, True
If Err.Number <> 0 Then
    MsgBox "Node.js is not installed or not in PATH." & vbCrLf & vbCrLf & "Please install Node.js from https://nodejs.org/", vbCritical, "Income Tax Challan Automation"
    WScript.Quit
End If
On Error GoTo 0

' Check if dependencies are installed
If Not objFSO.FolderExists(strScriptPath & "\node_modules") Then
    ' Show installing message
    Set objIE = CreateObject("InternetExplorer.Application")
    objIE.Navigate "about:blank"
    objIE.Visible = True
    objIE.ToolBar = False
    objIE.StatusBar = False
    objIE.Width = 400
    objIE.Height = 200
    objIE.Left = (objShell.Run("powershell -command '[System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width'", 0, True) - 400) / 2
    objIE.Top = (objShell.Run("powershell -command '[System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height'", 0, True) - 200) / 2
    
    objIE.Document.Write "<html><body style='font-family:Arial;text-align:center;padding:20px;'>"
    objIE.Document.Write "<h2>🚀 Income Tax Challan Automation</h2>"
    objIE.Document.Write "<p>Installing dependencies...</p>"
    objIE.Document.Write "<p>Please wait...</p></body></html>"
    
    ' Install dependencies
    objShell.Run "npm install", 0, True
    
    objIE.Quit
End If

' Start the server in background
objShell.Run "node server.js", 0, False

' Wait a moment for server to start
WScript.Sleep 3000

' Open the web interface
objShell.Run "http://localhost:3001"

' Show success message
MsgBox "🚀 Income Tax Challan Automation started successfully!" & vbCrLf & vbCrLf & "Web interface opened in your browser." & vbCrLf & "Server: http://localhost:3001", vbInformation, "Success"
