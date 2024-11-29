import express from 'express';
import upload from '../middlewares/uploadMiddleware.js'; // Import the upload middleware
const router = express.Router();

// Route to handle file upload
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.status(200).json({
        message: 'File uploaded successfully',
        file: req.file,
    });
});

export default router;
