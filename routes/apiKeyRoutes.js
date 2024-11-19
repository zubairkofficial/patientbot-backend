import express from 'express';
import apiKeyController from './../controllers/apiKeyController.js'; // Adjust the path as needed
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
// Model Routes
router.post('/models', apiKeyController.createModel);
router.get('/models', apiKeyController.getModels);

// API Key Routes
router.post('/api-keys', apiKeyController.createApiKey);
router.get('/api-keys', apiKeyController.getApiKeys);
router.put('/api-keys/:id', apiKeyController.updateApiKey);
router.delete('/api-keys/:id', apiKeyController.deleteApiKey);
router.get("/active-deepgram", apiKeyController.getActiveDeepgramKey);

export default router;
