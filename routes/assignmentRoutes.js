// assignmentRoutes.js
import express from 'express';
import assignmentController from '../controllers/assignmentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

// Apply authMiddleware to all routes in this router
const router = express.Router();
router.use(authMiddleware);


router.get('/', assignmentController.getAssignedPatients); // Get all patients
router.get('/:studentId', assignmentController.getAssignmentsByStudentId);



export default router;
