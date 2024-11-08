// routes/homeRoutes.js
import express from 'express';
import homeController from '../controllers/homeController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

// Route to get statistics
router.get('/stats', homeController.getStats);

export default router;
