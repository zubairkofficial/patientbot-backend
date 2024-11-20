// assignmentRoutes.js
import express from 'express';
import assignmentController from '../controllers/assignmentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

// Apply authMiddleware to all routes in this router
const router = express.Router();
router.use(authMiddleware);


router.get('/patients', assignmentController.getAssignedPatients);
router.get('/students', assignmentController.getAssignedStudents);
 // Get all patients
router.get('/:studentId', assignmentController.getAssignmentsByStudentId);
router.post('/store', assignmentController.storeConversationLog);
router.post('/submit', assignmentController.submitAssignment);
router.post('/assign-patient', assignmentController.assignPatient);
router.post('/assign-student', assignmentController.assignStudent);
router.get('/assignment/:id', assignmentController.getAssignmentById);
router.put('/', assignmentController.updateAssignment);



export default router;
