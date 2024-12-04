import { Assignment, Prompt } from '../models/index.js';
import { Patient } from '../models/index.js';
import { User } from '../models/index.js';
import { Symptom } from '../models/index.js';
import { Op } from 'sequelize';



const assignmentController = {

    async assignPatient(req, res) {
        const { studentId, patientIds, dueDate, isMarkable, creatorId } = req.body;

        // Check if studentId, patientIds, and creatorId are provided
        if (!studentId || !Array.isArray(patientIds) || patientIds.length === 0 || !creatorId) {
            return res.status(400).json({ message: 'Student ID, an array of patient IDs, and Creator ID are required.' });
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
                isMarkable: isMarkable,
                creatorId: creatorId // Set the creatorId
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
        const { patientId, studentIds, dueDate, isMarkable, creatorId } = req.body;

        // Check if patientId, studentIds, and creatorId are provided
        if (!patientId || !Array.isArray(studentIds) || studentIds.length === 0 || !creatorId) {
            return res.status(400).json({ message: 'Patient ID, an array of student IDs, and Creator ID are required.' });
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
                isMarkable,
                creatorId: creatorId // Set the creatorId
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
                attributes: ['id', 'status', 'dueDate', 'score', 'feedback', 'findings', 'conversationLog', 'isMarkable']
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
                    isMarkable: assignment.isMarkable,
                    conversationLog: assignment.conversationLog,
                    createdAt: assignment.createdAt,
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

    async getAssignedPatientsByCreator(req, res) {
        console.log("Fetching assigned patients for creator ID:", req.params.creatorId);
        try {
            // Ensure the creatorId parameter is provided
            const creatorId = req.params.creatorId;
            if (!creatorId) {
                return res.status(400).json({ message: 'Creator ID is required.' });
            }

            // Fetch all assignments where the creatorId matches and include related user (assignedUser) and patient details
            const assignments = await Assignment.findAll({
                where: {
                    creatorId: creatorId  // Filter assignments by the creatorId
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name'], // Fetch the user assigned to the assignment (student)
                    },
                    {
                        model: User,
                        as: 'creator',  // Include the user who created the assignment (creator)
                        attributes: ['id', 'name'], // Fetch the creator's name
                    },
                    {
                        model: Patient,
                        attributes: ['id', 'name'], // Include the patient's ID and name
                    }
                ],
                attributes: ['id', 'status', 'dueDate', 'score', 'feedback', 'findings', 'isMarkable', 'conversationLog', 'userId'] // Include the userId here
            });

            if (assignments.length === 0) {
                return res.status(404).json({ message: 'No assignments found for the given creator ID.' });
            }

            // Group assignments by assigned student (userId)
            const studentMap = new Map();

            assignments.forEach((assignment) => {
                const assignedUser = assignment.User;  // This is the student assigned to the task
                const creator = assignment.creator;  // This is the user who created the assignment

                if (!studentMap.has(assignedUser.id)) {
                    studentMap.set(assignedUser.id, {
                        id: assignedUser.id,
                        name: assignedUser.name,  // Student's name
                        assignedPatients: [],
                        creatorId: creator.id,
                        creatorName: creator.name,  // Creator's name
                    });
                }

                studentMap.get(assignedUser.id).assignedPatients.push({
                    id: assignment.Patient.id,
                    name: assignment.Patient.name,
                    assignmentId: assignment.id,
                    status: assignment.status,
                    dueDate: assignment.dueDate,
                    score: assignment.score,
                    feedback: assignment.feedback,
                    isMarkable: assignment.isMarkable,
                    findings: assignment.findings,
                    conversationLog: assignment.conversationLog,
                    userId: assignment.userId, // This is the userId that the assignment is assigned to
                    createdAt: assignment.createdAt,
                });
            });

            const response = Array.from(studentMap.values());
            console.log("Response:", response);

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
                    createdAt: student.Assignment.createdAt,
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
                        attributes: ['id', 'name'], // Include required Patient attributes
                        through: {
                            model: Assignment,
                            attributes: ['id', 'status', 'updatedAt', 'dueDate', 'score', 'feedback',
                                'mandatoryQuestionScore', 'symptomsScore', 'treatmentScore', 'isMarkable', 'requestStatus', 'createdAt'],
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
                assignedPatients: student.Patients.map((patient) => {
                    const assignment = patient.Assignment; // Access the assignment directly
                    return {
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
                        assignmentId: assignment ? assignment.id : null, // Ensure assignment exists
                        status: assignment ? assignment.status : null,
                        updatedAt: assignment ? assignment.updatedAt : null,
                        dueDate: assignment ? assignment.dueDate : null,
                        score: assignment ? assignment.score : null,
                        feedback: assignment ? assignment.feedback : null,
                        mandatoryQuestionScore: assignment ? assignment.mandatoryQuestionScore : null,
                        symptomsScore: assignment ? assignment.symptomsScore : null,
                        treatmentScore: assignment ? assignment.treatmentScore : null,
                        requestStatus: assignment ? assignment.requestStatus : null,
                        isMarkable: assignment ? assignment.isMarkable : null,
                        createdAt: assignment ? assignment.createdAt : null,
                    };
                }),
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
                createdAt: assignment.createdAt,
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
                assignment: {
                    ...assignment.get(), // Spread the assignment object to include all fields
                    assignmentId: assignment.id, // Include assignmentId
                    createdAt: assignment.createdAt, // Include createdAt
                }
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
