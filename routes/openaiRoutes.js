// routes/openaiRoute.js
import express from 'express';
import openaiController from '../controllers/openaiController.js';

const router = express.Router();

// Define the route to start the WebSocket connection
router.post('/extract', openaiController.extractData);

export default router;
