const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import our automation logic
const { runAutomation } = require('./automation-service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for cloud platforms
if (process.env.HEROKU_APP_NAME || process.env.RENDER) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for our app
}));

app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  trustProxy: process.env.HEROKU_APP_NAME || process.env.RENDER
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx) are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'Local',
    node_version: process.version,
    uptime: process.uptime()
  });
});

// Routes
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  
  // Check if file exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback HTML if public folder is missing
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Income Tax Challan Automation</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .container { max-width: 600px; margin: 0 auto; }
          .error { color: #e74c3c; }
          .info { color: #3498db; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Income Tax Challan Automation</h1>
          <p class="error">⚠️ Web interface files are missing from deployment.</p>
          <p class="info">📥 You can still download the Excel template:</p>
          <a href="/template" style="display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Download Excel Template</a>
          <p class="info">🔧 The deployment is being updated...</p>
          <hr>
          <p><strong>Health Check:</strong> <a href="/health">/health</a></p>
          <p><strong>Template Download:</strong> <a href="/template">/template</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

app.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sessionId = Date.now().toString();
    const filePath = req.file.path;

    // Send immediate response with session ID
    res.json({ 
      success: true, 
      sessionId: sessionId,
      message: 'File uploaded successfully. Processing will begin shortly.',
      filename: req.file.originalname
    });

    // Start automation in background
    setTimeout(() => {
      runAutomation(filePath, sessionId, io);
      console.log('File uploaded, starting automation...');
    }, 1000);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Template download route
app.get('/template', (req, res) => {
  try {
    const templatePath = path.join(__dirname, 'IncomeTax_Challan_Template.xlsx');
    
    if (fs.existsSync(templatePath)) {
      console.log('Template download requested');
      res.download(templatePath, 'IncomeTax_Challan_Template.xlsx', (err) => {
        if (err) {
          console.error('Template download error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Template download failed' });
          }
        }
      });
    } else {
      console.log('Template file not found');
      res.status(404).json({ error: 'Template file not found' });
    }
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ error: 'Template download failed: ' + error.message });
  }
});

// Download route for processed files
app.get('/download/:sessionId/:type', (req, res) => {
  const { sessionId, type } = req.params;
  
  try {
    let filePath;
    let fileName;
    
    const sessionDir = path.join(__dirname, 'processed', sessionId);
    
    if (type === 'excel') {
      filePath = path.join(sessionDir, `${sessionId}_processed.xlsx`);
      fileName = 'processed_challan_data.xlsx';
    } else if (type === 'pdfs') {
      filePath = path.join(sessionDir, `${sessionId}_pdfs.zip`);
      fileName = 'challan_pdfs.zip';
    } else if (type === 'report') {
      filePath = path.join(sessionDir, `${sessionId}_report.txt`);
      fileName = 'automation_report.txt';
    } else {
      return res.status(400).json({ error: 'Invalid download type' });
    }

    console.log(`Download request for ${type}: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      console.log(`File found, sending: ${filePath}`);
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
          }
        }
      });
    } else {
      console.log(`File not found: ${filePath}`);
      res.status(404).json({ error: 'File not found. Processing may still be in progress.' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed: ' + error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

// Add global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log the error
});

server.listen(PORT, () => {
  console.log(`🚀 Income Tax Challan Automation Server running on port ${PORT}`);
  console.log(`📱 Access the web interface at: http://localhost:${PORT}`);
  console.log(`🏢 Company users can access at: http://[your-server-ip]:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Cloud Platform: Local`);
}).on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1);
  }
});

module.exports = { app, server, io };
