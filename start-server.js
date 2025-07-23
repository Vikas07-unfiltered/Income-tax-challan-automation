const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Routes
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<h1>Income Tax Challan Automation</h1><p>Web interface files are missing.</p>');
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/template', (req, res) => {
  const templatePath = path.join(__dirname, 'IncomeTax_Challan_Template.xlsx');
  if (fs.existsSync(templatePath)) {
    res.download(templatePath, 'IncomeTax_Challan_Template.xlsx');
  } else {
    res.status(404).json({ error: 'Template file not found' });
  }
});

app.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sessionId = Date.now().toString();
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.originalname,
      sessionId: sessionId
    });

    // Simulate processing for demo
    setTimeout(() => {
      io.to(sessionId).emit('progress', {
        message: '🚀 Processing started...',
        progress: 10
      });
      
      setTimeout(() => {
        io.to(sessionId).emit('progress', {
          message: '📄 Reading Excel file...',
          progress: 30
        });
        
        setTimeout(() => {
          io.to(sessionId).emit('progress', {
            message: '🎉 Processing completed!',
            progress: 100,
            data: {
              processed: 5,
              successful: 5,
              failed: 0,
              downloadLinks: {
                excel: `/download/${sessionId}/excel`,
                pdfs: `/download/${sessionId}/pdfs`,
                report: `/download/${sessionId}/report`
              }
            }
          });
        }, 2000);
      }, 2000);
    }, 1000);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Download routes
app.get('/download/:sessionId/:type', (req, res) => {
  const { sessionId, type } = req.params;
  
  // For demo purposes, create dummy files
  if (type === 'excel') {
    res.json({ message: 'Excel download would start here', sessionId, type });
  } else if (type === 'pdfs') {
    res.json({ message: 'PDF ZIP download would start here', sessionId, type });
  } else if (type === 'report') {
    res.json({ message: 'Report download would start here', sessionId, type });
  } else {
    res.status(400).json({ error: 'Invalid download type' });
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Income Tax Challan Automation Server running on port ${PORT}`);
  console.log(`📱 Access the web interface at: http://localhost:${PORT}`);
  console.log('✅ Server is ready and running...');
});

// Keep process alive
process.stdin.resume();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

console.log('🔄 Server script loaded and ready...');
