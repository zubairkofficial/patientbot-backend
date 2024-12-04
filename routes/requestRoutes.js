// patientRoutes.js
import express from 'express';
import requestController from '../controllers/requestController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

// Apply authMiddleware to all routes in this router
const router = express.Router();
router.use(authMiddleware);

// Define CRUD routes for patient
// Add new patient
router.get('/', requestController.getAllReattemptRequests); // Get all patients
router.get('/:creatorId', requestController.getReattemptRequestsByCreator);
router.post('/handle' , requestController.handleReattemptRequest);
router.post('/create' , requestController.requestReattempt);



export default router;
