const express = require('express');
const cors = require('cors');
const qr = require('qr-image');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Generate QR code endpoint
app.post('/generate', (req, res) => {
  try {
    const { text, size = 300, margin = 4, color = '#000000', backgroundColor = '#FFFFFF' } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(300).json({ error: 'Text is required to generate QR code' });
    }
    
    // Generate QR code
    const qr_png = qr.imageSync(text, {
      type: 'png',
      size: parseInt(size),
      margin: parseInt(margin),
      parse_url: true
    });
    
    // Convert to base64
    const qrBase64 = qr_png.toString('base64');
    
    res.json({
      success: true,
      qrCode: `data:image/png;base64,${qrBase64}`,
      text: text
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Download QR code endpoint
app.post('/download', (req, res) => {
  try {
    const { text, size = 300, margin = 4, color = '#000000', backgroundColor = '#FFFFFF' } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(300).json({ error: 'Text is required to generate QR code' });
    }
    
    // Generate filename
    const filename = `qr-code-${Date.now()}.png`;
    const filepath = path.join(tempDir, filename);
    
    // Generate and save QR code
    const qr_png = qr.imageSync(text, {
      type: 'png',
      size: parseInt(size),
      margin: parseInt(margin),
      parse_url: true
    });
    
    fs.writeFileSync(filepath, qr_png);
    
    // Send file for download
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up temp file after sending
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    });
    
  } catch (error) {
    console.error('Error generating QR code for download:', error);
    res.status(500).json({ error: 'Failed to generate QR code for download' });
  }
});

// Clear temp files endpoint (optional, for cleanup)
app.get('/cleanup', (req, res) => {
  try {
    const files = fs.readdirSync(tempDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filepath = path.join(tempDir, file);
      const stat = fs.statSync(filepath);
      const now = new Date().getTime();
      const fileAge = now - stat.mtime.getTime();
      
      // Delete files older than 1 hour
      if (fileAge > 3600000) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    });
    
    res.json({ message: `Cleaned up ${deletedCount} temporary files` });
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    res.status(500).json({ error: 'Failed to clean up temp files' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});