// routes/symptomRoutes.js
import express from 'express';
import symptomController from '../controllers/symptomController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
// Create a new symptom
router.post('/', symptomController.createSymptom);

// Get all symptoms
router.get('/', symptomController.getAllSymptoms);

// Get a single symptom by ID
router.get('/:id', symptomController.getSymptomById);

// Update a symptom by ID
router.put('/:id', symptomController.updateSymptom);

// Delete a symptom by ID
router.delete('/:id', symptomController.deleteSymptom);

export default router;
