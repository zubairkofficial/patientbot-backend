// patientRoutes.js
import express from "express";
import patientController from "../controllers/patientController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

// Apply authMiddleware to all routes in this router
const router = express.Router();
router.use(authMiddleware);

// Define CRUD routes for patient
router.post("/", patientController.createPatient); // Add new patient
router.get("/", patientController.getAllPatients); // Get all patients
router.get("/patientId/:id", patientController.getPatientById); // Get all patients
router.put("/:id", patientController.updatePatient); // Update patient
router.delete("/:id", patientController.deletePatient); // Delete patient

export default router;
