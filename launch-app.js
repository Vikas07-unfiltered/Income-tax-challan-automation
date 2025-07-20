#!/usr/bin/env node

/**
 * 🚀 Income Tax Challan Automation - Desktop Launcher
 * 
 * This script creates a desktop application experience:
 * 1. Starts the local server
 * 2. Opens the web browser automatically
 * 3. Provides a system tray icon (optional)
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🚀 Income Tax Challan Automation - Desktop Launcher');
console.log('=' .repeat(60));

// Configuration
const PORT = 3001;
const APP_URL = `http://localhost:${PORT}`;
const APP_NAME = 'Income Tax Challan Automation';

// Check if server is already running
function checkServerRunning() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
      resolve(stdout.includes(`:${PORT}`));
    });
  });
}

// Kill existing server if running
function killExistingServer() {
  return new Promise((resolve) => {
    exec(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${PORT}') do taskkill /f /pid %a`, (error) => {
      setTimeout(resolve, 1000); // Wait a bit for cleanup
    });
  });
}

// Start the server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Starting server...');
    
    const serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let serverReady = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('running on port') && !serverReady) {
        serverReady = true;
        console.log('✅ Server started successfully!');
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!serverReady) {
        console.log('⚠️  Server taking longer than expected, but continuing...');
        resolve(serverProcess);
      }
    }, 10000);
  });
}

// Open browser
function openBrowser() {
  console.log('🌐 Opening web browser...');
  
  const platform = os.platform();
  let command;

  switch (platform) {
    case 'win32':
      command = `start ${APP_URL}`;
      break;
    case 'darwin':
      command = `open ${APP_URL}`;
      break;
    case 'linux':
      command = `xdg-open ${APP_URL}`;
      break;
    default:
      console.log(`Please open ${APP_URL} in your browser`);
      return;
  }

  exec(command, (error) => {
    if (error) {
      console.error('Failed to open browser:', error);
      console.log(`Please manually open: ${APP_URL}`);
    } else {
      console.log('✅ Browser opened successfully!');
    }
  });
}

// Wait for server to be ready
function waitForServer(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      console.log(`🔍 Checking server... (${attempts}/${maxAttempts})`);
      
      const http = require('http');
      const req = http.get(APP_URL, (res) => {
        console.log('✅ Server is ready!');
        resolve();
      });

      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Server failed to start'));
        } else {
          setTimeout(checkServer, 1000);
        }
      });

      req.setTimeout(1000);
    };

    checkServer();
  });
}

// Create desktop shortcut (Windows)
function createDesktopShortcut() {
  if (os.platform() !== 'win32') {
    console.log('⚠️  Desktop shortcut creation is only supported on Windows');
    return;
  }

  const desktopPath = path.join(os.homedir(), 'Desktop');
  const shortcutPath = path.join(desktopPath, `${APP_NAME}.bat`);
  
  const batchContent = `@echo off
cd /d "${__dirname}"
node launch-app.js
pause`;

  try {
    fs.writeFileSync(shortcutPath, batchContent);
    console.log(`✅ Desktop shortcut created: ${shortcutPath}`);
  } catch (error) {
    console.error('Failed to create desktop shortcut:', error);
  }
}

// Handle graceful shutdown
function setupGracefulShutdown(serverProcess) {
  const cleanup = () => {
    console.log('\n🛑 Shutting down...');
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

// Show app info
function showAppInfo() {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 INCOME TAX CHALLAN AUTOMATION - READY!');
  console.log('='.repeat(60));
  console.log(`📱 Web Interface: ${APP_URL}`);
  console.log(`🏢 Share with team: http://[your-ip]:${PORT}`);
  console.log('📥 Features Available:');
  console.log('   ✅ Download Excel Template');
  console.log('   ✅ Upload & Process Files');
  console.log('   ✅ Real-time Progress Tracking');
  console.log('   ✅ Download Results (Excel, PDFs, Reports)');
  console.log('\n💡 Tips:');
  console.log('   • Keep this window open while using the app');
  console.log('   • Press Ctrl+C to stop the server');
  console.log('   • Bookmark the URL for quick access');
  console.log('='.repeat(60));
}

// Main function
async function main() {
  try {
    // Check if server is already running
    const isRunning = await checkServerRunning();
    if (isRunning) {
      console.log('⚠️  Server is already running. Killing existing instance...');
      await killExistingServer();
    }

    // Start the server
    const serverProcess = await startServer();
    
    // Setup graceful shutdown
    setupGracefulShutdown(serverProcess);
    
    // Wait for server to be ready
    await waitForServer();
    
    // Open browser
    openBrowser();
    
    // Show app info
    showAppInfo();
    
    // Create desktop shortcut (first time)
    const shortcutPath = path.join(os.homedir(), 'Desktop', `${APP_NAME}.bat`);
    if (!fs.existsSync(shortcutPath)) {
      createDesktopShortcut();
    }

    // Keep the process alive
    console.log('\n🔄 Server is running... Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure no other app is using port 3001');
    console.log('2. Check if all dependencies are installed: npm install');
    console.log('3. Try running: npm start');
    process.exit(1);
  }
}

// Run the application
main();
