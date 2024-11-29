// config/uploadMiddleware.js

import multer from 'multer';
import path from 'path';

// Updated allowed MIME types for images, videos, and audio files
const allowedMimes = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mp3', 'audio/midi', 'audio/pcm',
  // Video
  'video/mp4', 'video/avi', 'video/mkv', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
];

// Configure multer storage options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the folder for storing files
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = Date.now() + fileExtension; // Add timestamp to avoid naming conflicts
    cb(null, fileName);
  },
});

// File filter function to check file types
const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type'), false); // Reject the file
  }
};

// Initialize multer with storage options and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit (adjust as needed)
  },
});

export default upload;
