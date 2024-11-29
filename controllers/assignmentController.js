import { Assignment, Prompt } from '../models/index.js';
import { Patient } from '../models/index.js';
import { User } from '../models/index.js';
import { Symptom } from '../models/index.js';
import { Op } from 'sequelize';

const assignmentController = {

    async assignPatient(req, res) {
        const { studentId, patientIds, dueDate, isMarkable } = req.body;

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

            // Check if assignments already exist for any of the student-patient pairs
            const existingAssignments = await Assignment.findAll({
                where: {
                    userId: studentId,
                    patientId: {
                        [Op.in]: patientIds,
                    },
                },
            });

            if (existingAssignments.length > 0) {
                return res.status(400).json({ message: 'One or more assignments already exist for the specified student and patients.' });
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
                isMarkable: isMarkable
            }));

            // Bulk create the assignments
            await Assignment.bulkCreate(assignments);

            res.status(200).json({ message: 'Patients assigned to student successfully.' });
        } catch (error) {
            console.error('Error assigning patients to student:', error);
            res.status(500).json({ message: 'An error occurred while assigning patients to the student.' });
        }
    },

    async assignStudent(req, res) {
        const { patientId, studentIds, dueDate, isMarkable } = req.body;

        // Check if patientId and studentIds are provided
        if (!patientId || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Patient ID and an array of student IDs are required.' });
        }

        try {
            // Ensure the patient exists
            const patient = await Patient.findByPk(patientId);
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found.' });
            }

            // Ensure all students exist
            const students = await User.findAll({
                where: { id: studentIds },
            });

            if (students.length !== studentIds.length) {
                return res.status(404).json({ message: 'One or more students not found.' });
            }

            // Check if assignments already exist for any of the student-patient pairs
            const existingAssignments = await Assignment.findAll({
                where: {
                    patientId,
                    userId: {
                        [Op.in]: studentIds,
                    },
                },
            });

            if (existingAssignments.length > 0) {
                return res.status(400).json({ message: 'One or more assignments already exist for the specified patient and students.' });
            }

            // Create entries in Assignment for each student-patient relationship
            const assignments = studentIds.map(studentId => ({
                userId: studentId,
                patientId,
                status: 'assigned', // Set status as 'assigned'
                dueDate: dueDate || null, // Optional due date
                score: null,
                mandatoryQuestionScore: null,
                symptomsScore: null,
                treatmentScore: null,
                feedback: null,
                isMarkable
            }));

            // Bulk create the assignments
            await Assignment.bulkCreate(assignments);

            res.status(200).json({ message: 'Patient assigned to students successfully.' });
        } catch (error) {
            console.error('Error assigning student to patient:', error);
            res.status(500).json({ message: 'An error occurred while assigning the patient to students.' });
        }
    },

    async getAssignedPatients(req, res) {
        console.log("Fetching assigned patients");
        try {
            // Fetch all assignments with related student and patient details
            const assignments = await Assignment.findAll({
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Patient,
                        attributes: ['id', 'name'],
                    }
                ],
                attributes: ['id', 'status', 'dueDate', 'score', 'feedback', 'findings', 'conversationLog']
            });

            // Group assignments by student
            const studentMap = new Map();

            assignments.forEach((assignment) => {
                if (!studentMap.has(assignment.User.id)) {
                    studentMap.set(assignment.User.id, {
                        id: assignment.User.id,
                        name: assignment.User.name,
                        assignedPatients: []
                    });
                }

                studentMap.get(assignment.User.id).assignedPatients.push({
                    id: assignment.Patient.id,
                    name: assignment.Patient.name,
                    assignmentId: assignment.id,
                    status: assignment.status,
                    dueDate: assignment.dueDate,
                    score: assignment.score,
                    feedback: assignment.feedback,
                    findings: assignment.findings,
                    conversationLog: assignment.conversationLog,
                });
            });

            const response = Array.from(studentMap.values());
            console.log("object: response", response);

            res.status(200).json({ students: response });
        } catch (error) {
            console.error('Error fetching assigned patients:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching assigned patients.' });
        }
    },

    async getAssignedStudents(req, res) {
        console.log("Fetching all students assigned to patients");
        try {
            // Fetch all patients with their assigned students and assignment details
            const patients = await Patient.findAll({
                include: [
                    {
                        model: User, // Students
                        through: {
                            model: Assignment,
                            attributes: ['id', 'status', 'dueDate', 'score', 'feedback', 'findings', 'conversationLog'], // Include assignment details
                        },
                    },
                ],
            });

            // Map the data to structure it as needed
            const response = patients.map((patient) => ({
                id: patient.id,
                name: patient.name,
                assignedStudents: patient.Users.map((student) => ({
                    id: student.id,
                    name: student.name,
                    username: student.username,
                    email: student.email,
                    status: student.Assignment.status,
                    assignmentId: student.Assignment.id,
                    dueDate: student.Assignment.dueDate,
                    score: student.Assignment.score,
                    feedback: student.Assignment.feedback,
                    findings: student.Assignment.findings,
                    conversationLog: student.Assignment.conversationLog,
                    date: student.Assignment.createdAt,
                })),
            }));

            // Send the response with all patients and their assigned students
            res.status(200).json({ patients: response });
        } catch (error) {
            console.error('Error fetching assigned students for all patients:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching assigned students for all patients.' });
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
                        attributes: ['id', 'name', 'answer'], // Include required Patient attributes
                        through: {
                            model: Assignment,
                            attributes: ['id', 'status', 'updatedAt', 'dueDate', 'score', 'feedback',
                                'mandatoryQuestionScore', 'symptomsScore', 'treatmentScore', 'isMarkable'],
                        },
                        include: [
                            {
                                model: Symptom,
                                attributes: ['id', 'name', 'description'],
                                through: { attributes: [] },
                            },
                            {
                                model: Prompt,
                                attributes: ['mandatoryQuestions', 'medicalHistory', 'predefinedTreatments'],
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
                    answer: patient.answer,
                    symptoms: patient.Symptoms.map((symptom) => ({
                        id: symptom.id,
                        name: symptom.name,
                        description: symptom.description,
                    })),
                    prompt: patient.Prompt ? {
                        mandatoryQuestions: patient.Prompt.mandatoryQuestions,
                        medicalHistory: patient.Prompt.medicalHistory,
                        predefinedTreatments: patient.Prompt.predefinedTreatments,
                    } : null,
                    assignmentId: patient.Assignment.id,
                    status: patient.Assignment.status,
                    updatedAt: patient.Assignment.updatedAt,
                    dueDate: patient.Assignment.dueDate,
                    score: patient.Assignment.score,
                    feedback: patient.Assignment.feedback,
                    mandatoryQuestionScore: patient.Assignment.mandatoryQuestionScore,
                    symptomsScore: patient.Assignment.symptomsScore,
                    treatmentScore: patient.Assignment.treatmentScore,
                    isMarkable: patient.Assignment.isMarkable,
                })),
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Error fetching assignments for student:', error.message, error.stack);
            res.status(500).json({ message: error.message });
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

        // Validate basic input
        if (!studentId || !patientId) {
            return res.status(400).json({ message: 'Student ID and Patient ID are required.' });
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

            // Check for conversation log
            if (!assignment.conversationLog) {
                return res.status(400).json({ message: 'Please talk to patient before submitting the assignment.' });
            }

            // Check findings requirement based on isMarkable flag
            if (assignment.isMarkable) {
                if (!findings) {
                    return res.status(400).json({ message: 'Submit your diagnosis to proceed.' });
                }
                assignment.findings = findings;
            }

            // Update status
            assignment.status = 'completed';
            await assignment.save();

            res.status(200).json({ message: 'Assignment submitted successfully.' });
        } catch (error) {
            console.error('Error submitting assignment:', error);
            res.status(500).json({ message: 'An error occurred while submitting the assignment.' });
        }
    },

    async getAssignmentById(req, res) {
        const { id } = req.params;

        // Validate input
        if (!id) {
            return res.status(400).json({ message: 'Assignment ID is required.' });
        }

        try {
            // Find the assignment with the specified ID, including the patient and user (student)
            const assignment = await Assignment.findByPk(id, {
                include: [
                    {
                        model: Patient,
                        attributes: ['id', 'name'], // Fetch patient name and ID
                    },
                    {
                        model: User,
                        attributes: ['id', 'name'], // Fetch student name and ID
                    },
                ],
            });

            // Check if assignment exists
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found.' });
            }

            // Structure the response
            const response = {
                id: assignment.id,
                status: assignment.status,
                dueDate: assignment.dueDate,
                findings: assignment.findings,
                feedback: assignment.feedback,
                score: assignment.score,
                isMarkable: assignment.isMarkable,
                mandatoryQuestionScore: assignment.mandatoryQuestionScore,
                symptomsScore: assignment.symptomsScore,
                treatmentScore: assignment.treatmentScore,
                diagnosisScore: assignment.diagnosisScore,
                conversationLog: assignment.conversationLog ? JSON.parse(assignment.conversationLog) : null,
                patient: assignment.Patient ? { id: assignment.Patient.id, name: assignment.Patient.name } : null,
                student: assignment.User ? { id: assignment.User.id, name: assignment.User.name } : null,
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Error fetching assignment by ID:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching the assignment.' });
        }
    },

    async updateAssignment(req, res) {
        try {
            const { assignmentId, feedback, scores } = req.body;

            if (!assignmentId || !feedback || !scores) {
                return res.status(400).json({
                    error: "Assignment ID, feedback, and scores are required."
                });
            }

            // Fetch the assignment from the database using the provided ID
            const assignment = await Assignment.findByPk(assignmentId);

            if (!assignment) {
                return res.status(404).json({ error: "Assignment not found." });
            }

            // Validate and update scores
            const {
                totalScore,
                mandatoryQuestionScore,
                symptomsScore,
                treatmentScore,
                diagnosisScore
            } = scores;

            if (
                totalScore == null ||
                mandatoryQuestionScore == null ||
                symptomsScore == null ||
                treatmentScore == null ||
                diagnosisScore == null
            ) {
                return res.status(400).json({
                    error:
                        "All score fields (totalScore, mandatoryQuestionScore, symptomsScore, treatmentScore, diagnosisScore) are required."
                });
            }

            // Update assignment fields
            assignment.feedback = feedback;
            assignment.score = totalScore;
            assignment.mandatoryQuestionScore = mandatoryQuestionScore;
            assignment.symptomsScore = symptomsScore;
            assignment.treatmentScore = treatmentScore;
            assignment.diagnosisScore = diagnosisScore;

            await assignment.save();

            return res.json({
                message: "Assignment updated successfully.",
                assignment
            });
        } catch (error) {
            console.error("Error updating assignment:", error);
            return res.status(500).json({ error: "An error occurred while updating the assignment." });
        }
    },

    async deleteAssignment(req, res) {
        const { id } = req.params;

        // Validate input
        if (!id) {
            return res.status(400).json({ message: 'Assignment ID is required.' });
        }

        try {
            // Find the assignment
            const assignment = await Assignment.findByPk(id);

            // Check if assignment exists
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found.' });
            }

            // Delete the assignment
            await assignment.destroy();

            res.status(200).json({
                message: 'Assignment deleted successfully.',
                deletedAssignmentId: id
            });
        } catch (error) {
            console.error('Error deleting assignment:', error);
            res.status(500).json({
                message: 'An error occurred while deleting the assignment.',
                error: error.message
            });
        }
    },

    async getUnassignedPatients(req, res) {
        const { studentId } = req.params;

        // Validate input
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required.' });
        }

        try {
            // Fetch all patients assigned to the student
            const assignedPatients = await Assignment.findAll({
                where: { userId: studentId },
                attributes: ['patientId'],
            });

            const assignedPatientIds = assignedPatients.map(assignment => assignment.patientId);

            // Fetch all patients that are not assigned to the student
            const unassignedPatients = await Patient.findAll({
                where: {
                    id: {
                        [Op.notIn]: assignedPatientIds,
                    },
                },
            });

            res.status(200).json({ patients: unassignedPatients });
        } catch (error) {
            console.error('Error fetching unassigned patients:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching unassigned patients.' });
        }
    },

    async getUnassignedStudents(req, res) {
        const { patientId } = req.params;

        // Validate input
        if (!patientId) {
            return res.status(400).json({ message: 'Patient ID is required.' });
        }

        try {
            // Fetch all students assigned to the patient
            const assignedStudents = await Assignment.findAll({
                where: { patientId: patientId },
                attributes: ['userId'],
            });

            const assignedStudentIds = assignedStudents.map(assignment => assignment.userId);

            // Fetch all students that are not assigned to the patient
            const unassignedStudents = await User.findAll({
                where: {
                    id: {
                        [Op.notIn]: assignedStudentIds,
                    },
                },
            });

            res.status(200).json({ students: unassignedStudents });
        } catch (error) {
            console.error('Error fetching unassigned students:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching unassigned students.' });
        }
    }

};

export default assignmentController;
