import { PatientUser } from '../models/index.js';
import { Patient } from '../models/index.js';
import { User } from '../models/index.js';


const assignmentController = {

    async assignPatient(req, res) {
        const { studentId, patientIds } = req.body;
    
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
    
            // Create entries in PatientUser for each patient-student relationship with status 'assigned'
            const assignments = patientIds.map(patientId => ({
                userId: studentId,
                patientId,
                status: 'assigned', // Set status as 'assigned'
            }));
    
            // Bulk create the relationships in PatientUser table
            await PatientUser.bulkCreate(assignments, { ignoreDuplicates: true });
    
            res.status(200).json({ message: 'Patients assigned to student successfully.' });
        } catch (error) {
            console.error('Error assigning patients to student:', error);
            res.status(500).json({ message: 'An error occurred while assigning patients to the student.' });
        }
    },
    


    // Get all patients with symptoms
    async getAssignedPatients(req, res) {
        console.log("I am hit asisgned patitents")
        try {
            // Fetch all users (students) with their assigned patients and status
            const students = await User.findAll({
                include: [
                    {
                        model: Patient,
                        through: {
                            attributes: ['status'], // Include only the 'status' from PatientUser
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
                    status: patient.PatientUser.status, // Access status from the PatientUser join table
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
            // Fetch the student with the specified ID along with assigned patients and statuses
            const student = await User.findByPk(studentId, {
                include: [
                    {
                        model: Patient,
                        through: {
                            attributes: ['status'], // Include the 'status' from PatientUser
                        },
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
                    status: patient.PatientUser.status, // Access status from the PatientUser join table
                })),
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Error fetching assignments for student:', error.message, error.stack);
            res.status(500).json({ message: 'An error occurred while fetching assignments for the student.' });
        }
    },
};



export default assignmentController;
