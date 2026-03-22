require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE) || 10) * 1024 * 1024;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['your-frontend-url'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Image Background Remover API is running' });
});

// Upload and remove background
app.post('/api/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!process.env.REMOVE_BG_API_KEY) {
      return res.status(500).json({ error: 'Remove.bg API key not configured' });
    }

    // Create form data for remove.bg API
    const formData = new FormData();
    formData.append('image_file', req.file.buffer, req.file.originalname);
    formData.append('size', 'auto');

    // Call remove.bg API
    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': process.env.REMOVE_BG_API_KEY
      },
      responseType: 'arraybuffer'
    });

    if (response.status !== 200) {
      console.error('Remove.bg API error:', response.data);
      return res.status(response.status).json({ 
        error: 'Failed to process image', 
        details: response.data.toString() 
      });
    }

    // Send the processed image back
    res.setHeader('Content-Type', 'image/png');
    res.send(response.data);

  } catch (error) {
    console.error('Error processing image:', error);
    
    if (error.response) {
      const errorMsg = error.response.data.toString();
      res.status(error.response.status).json({ 
        error: 'API error', 
        details: errorMsg 
      });
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ 
        error: 'File too large', 
        details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  }
});

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: error.message || 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 API Key configured: ${!!process.env.REMOVE_BG_API_KEY}`);
});
