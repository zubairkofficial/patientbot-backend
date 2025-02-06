// routes/openaiRoute.js
import express from 'express';
import openaiController from '../controllers/openaiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

// Apply authMiddleware to all routes in this router
const router = express.Router();
router.use(authMiddleware);

// Define the route to start the WebSocket connection
router.post('/results', openaiController.extractData);
router.post('/resultsByPatient', openaiController.extractDataMultiple);
router.get('/openAiModels', openaiController.openaiModels);
router.get("/deepgramModels", openaiController.deepgramModel);

export default router;
