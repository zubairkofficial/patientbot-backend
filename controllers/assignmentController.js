import { Assignment } from '../models/index.js';
import { Patient } from '../models/index.js';
import { User } from '../models/index.js';
import { Symptom } from '../models/index.js';

const assignmentController = {
    async assignPatient(req, res) {
        const { studentId, patientIds, dueDate } = req.body;

        // Check if studentId and patientIds are provided
        if (!studentId || !Array.isArray(patientIds) || patientIds.length === 0) {
            return res.status(400).json({ message: 'Student ID and an array of patient IDs are required.' });
        }

        try {
            // Ensure the student (user) and patients exist
            const student = await User.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ message: 'Student not found.' });
            }

            const patients = await Patient.findAll({
                where: { id: patientIds },
            });

            if (patients.length !== patientIds.length) {
                return res.status(404).json({ message: 'One or more patients not found.' });
            }

            // Create entries in Assignment for each patient-student relationship
            const assignments = patientIds.map(patientId => ({
                userId: studentId,
                patientId,
                status: 'assigned', // Set status as 'assigned'
                dueDate: dueDate || null, // Optional due date
                score: null,
                mandatoryQuestionScore: null,
                symptomsScore: null,
                treatmentScore: null,
                feedback: null,
            }));

            // Bulk create the assignments
            await Assignment.bulkCreate(assignments, { ignoreDuplicates: true });

            res.status(200).json({ message: 'Patients assigned to student successfully.' });
        } catch (error) {
            console.error('Error assigning patients to student:', error);
            res.status(500).json({ message: 'An error occurred while assigning patients to the student.' });
        }
    },

    async getAssignedPatients(req, res) {
        console.log("Fetching assigned patients");
        try {
            // Fetch all users (students) with their assigned patients and assignment details
            const students = await User.findAll({
                include: [
                    {
                        model: Patient,
                        through: {
                            model: Assignment,
                            attributes: ['status', 'dueDate', 'score', 'feedback'], // Include additional assignment details
                        },
                    },
                ],
            });

            // Map the data to structure it as needed
            const response = students.map((student) => ({
                id: student.id,
                name: student.name,
                assignedPatients: student.Patients.map((patient) => ({
                    id: patient.id,
                    name: patient.name,
                    status: patient.Assignment.status,
                    dueDate: patient.Assignment.dueDate,
                    score: patient.Assignment.score,
                    feedback: patient.Assignment.feedback,
                })),
            }));

            res.status(200).json({ students: response });
        } catch (error) {
            console.error('Error fetching assigned patients:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching assigned patients.' });
        }
    },

    async getAssignmentsByStudentId(req, res) {
        const { studentId } = req.params;
    
        // Validate input
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required.' });
        }
    
        try {
            // Fetch the student with the specified ID along with assigned patients, assignment details, and symptoms
            const student = await User.findByPk(studentId, {
                include: [
                    {
                        model: Patient,
                        attributes: ['id', 'name', 'prompt', 'answer'], // Include all attributes from Patient
                        through: {
                            model: Assignment,
                            attributes: ['status', 'dueDate', 'score', 'feedback', 'mandatoryQuestionScore', 'symptomsScore', 'treatmentScore'],
                        },
                        include: [
                            {
                                model: Symptom,
                                attributes: ['id', 'name', 'description'], // Include desired attributes from Symptom
                                through: { attributes: [] }, // Exclude PatientSymptom join table attributes
                            },
                        ],
                    },
                ],
            });
    
            // Check if student exists
            if (!student) {
                return res.status(404).json({ message: 'Student not found.' });
            }
    
            // Map the data to structure it as needed
            const response = {
                id: student.id,
                name: student.name,
                assignedPatients: student.Patients.map((patient) => ({
                    id: patient.id,
                    name: patient.name,
                    prompt: patient.prompt,
                    answer: patient.answer,
                    symptoms: patient.Symptoms.map((symptom) => ({
                        id: symptom.id,
                        name: symptom.name,
                        description: symptom.description,
                    })),
                    // Assignment details
                    status: patient.Assignment.status,
                    dueDate: patient.Assignment.dueDate,
                    score: patient.Assignment.score,
                    feedback: patient.Assignment.feedback,
                    mandatoryQuestionScore: patient.Assignment.mandatoryQuestionScore,
                    symptomsScore: patient.Assignment.symptomsScore,
                    treatmentScore: patient.Assignment.treatmentScore,
                })),
            };
    
            res.status(200).json(response);
        } catch (error) {
            console.error('Error fetching assignments for student:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching assignments for the student.' });
        }
    },
    

    async storeConversationLog(req, res) {
        const { studentId, patientId, messages } = req.body;

        // Validate input
        if (!studentId || !patientId || !Array.isArray(messages)) {
            return res.status(400).json({ message: 'Student ID, Patient ID, and messages array are required.' });
        }

        try {
            // Find the specific assignment entry
            const assignment = await Assignment.findOne({
                where: {
                    userId: studentId,
                    patientId: patientId,
                },
            });

            // Check if assignment exists
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found for the given student and patient.' });
            }

            // Update the conversation log
            assignment.conversationLog = JSON.stringify(messages); // Store as JSON string
            assignment.status = 'inprogress';
            await assignment.save();

            res.status(200).json({ message: 'Conversation log saved successfully.' });
        } catch (error) {
            console.error('Error storing conversation log:', error);
            res.status(500).json({ message: 'An error occurred while storing the conversation log.' });
        }
    },

    async submitAssignment(req, res) {
        const { studentId, patientId, findings } = req.body;
    
        // Validate input
        if (!studentId || !patientId || !findings) {
            return res.status(400).json({ message: 'Student ID, Patient ID, and findings are required.' });
        }
    
        try {
            // Find the specific assignment entry
            const assignment = await Assignment.findOne({
                where: {
                    userId: studentId,
                    patientId: patientId,
                },
            });
    
            // Check if assignment exists
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found for the given student and patient.' });
            }
    
            // Update the findings and status
            assignment.findings = findings;
            assignment.status = 'completed';
            await assignment.save();
    
            res.status(200).json({ message: 'Assignment submitted successfully.' });
        } catch (error) {
            console.error('Error submitting assignment:', error);
            res.status(500).json({ message: 'An error occurred while submitting the assignment.' });
        }
    }
    

};

export default assignmentController;
