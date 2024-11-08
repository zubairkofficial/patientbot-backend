import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PatientUser } from '../models/index.js';
import { Patient } from '../models/index.js';
// Controller for handling user operations
const userController = {
    // Create a new user
    async createUser(req, res) {
        const { name, email, password, username, isAdmin, isActive, isSuperAdmin } = req.body;

        try {
            // Check if email or username already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use.' });
            }

            // Hash password


            // Create user
            const newUser = await User.create({
                id: uuidv4(),
                name,
                email,
                password,
                username,
                isAdmin: isAdmin || false,
                isActive: isActive || false,
                isSuperAdmin: isSuperAdmin || false,
            });

            res.status(201).json({ message: 'User created successfully', user: newUser });
        } catch (error) {
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    },

    // Get all users
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving users', error: error.message });
        }
    },

    async getAllStudents(req, res) {
        try {
            const users = await User.findAll({ where: { isAdmin: false, isSuperAdmin: false } });
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving users', error: error.message });
        }
    },

    // Get a single user by ID
    async getUserById(req, res) {
        const { id } = req.params;

        try {
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving user', error: error.message });
        }
    },

    // Update user by ID
    async updateUser(req, res) {
        const { id } = req.params;
        const { name, email, password, username, isAdmin, isActive, isSuperAdmin } = req.body;

        console.log(`Received request to update user with ID: ${id}`);
        console.log("Request body:", { name, email, password, username, isAdmin, isActive, isSuperAdmin });

        try {
            // Find the user by ID
            const user = await User.findByPk(id);
            if (!user) {
                console.warn(`User with ID ${id} not found.`);
                return res.status(404).json({ message: 'User not found' });
            }

            console.log(`User found:`, user);

            // Update user fields
            user.name = name || user.name;
            user.email = email || user.email;
            user.username = username || user.username;
            user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;
            user.isActive = isActive !== undefined ? isActive : user.isActive;
            user.isSuperAdmin = isSuperAdmin !== undefined ? isSuperAdmin : user.isSuperAdmin;

            if (password) {
                console.log("Password provided, hashing new password...");
                user.password = user.password;
            } else {
                console.log("No new password provided, keeping the existing password.");
            }

            // Save the updated user
            await user.save();

            console.log("User updated successfully:", user);
            res.status(200).json({ message: 'User updated successfully', user });
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ message: 'Error updating user', error: error.message });
        }
    },


    // Delete user by ID
    async deleteUser(req, res) {
        const { id } = req.params;

        try {
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            await user.destroy();
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting user', error: error.message });
        }
    },

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
    



};

export default userController;