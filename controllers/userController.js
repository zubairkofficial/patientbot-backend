import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../models/index.js';
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
            if (error.name === 'SequelizeValidationError') {
                // Handle Sequelize validation errors
                const validationErrors = error.errors.map((err) => err.message);
                console.error("Validation error updating user:", validationErrors);
                return res.status(400).json({ message: 'Validation error', errors: validationErrors });
            } else if (error.name === 'SequelizeUniqueConstraintError') {
                // Handle unique constraint violations (e.g., email/username already in use)
                console.error("Unique constraint error updating user:", error.errors[0].message);
                return res.status(400).json({ message: 'Email/username already in use', error: error.errors[0].message });
            } else {
                // Generic error handling for unexpected issues
                console.error("Unexpected error updating user:", error);
                return res.status(500).json({ message: 'An unexpected error occurred while updating user', error: error.message });
            }
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
    // Update user by ID
    async updateUser(req, res) {
        const { id } = req.params;
        const { name, email, username, isAdmin, isActive, isSuperAdmin } = req.body;
    
        console.log(`Received request to update user with ID: ${id}`);
        console.log("Request body:", { name, email, username, isAdmin, isActive, isSuperAdmin });
    
        try {
            // Validate request parameters
            if (!id) {
                return res.status(400).json({ message: 'User ID is required.' });
            }
    
            // Validate email format if email is being updated
            if (email && !/^\S+@\S+\.\S+$/.test(email)) {
                return res.status(400).json({ message: 'Invalid email format.' });
            }
    
            // Find the user by ID
            const user = await User.findByPk(id);
            if (!user) {
                console.warn(`User with ID ${id} not found.`);
                return res.status(404).json({ message: 'User not found' });
            }
    
            console.log(`User found:`, user);
    
            // Update user fields without modifying the password
            user.name = name || user.name;
            user.email = email || user.email;
            user.username = username || user.username;
            user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;
            user.isActive = isActive !== undefined ? isActive : user.isActive;
            user.isSuperAdmin = isSuperAdmin !== undefined ? isSuperAdmin : user.isSuperAdmin;
    
            console.log("No password field processed. Updating user information only.");
    
            // Save the updated user without updating the password
            await user.save();
    
            console.log("User updated successfully:", user);
            res.status(200).json({ message: 'User updated successfully', user });
        } catch (error) {
            // Specific error handling for different scenarios
            if (error.name === 'SequelizeValidationError') {
                // Handle Sequelize validation errors
                const validationErrors = error.errors.map((err) => err.message);
                console.error("Validation error updating user:", validationErrors);
                return res.status(400).json({ message: 'Validation error', errors: validationErrors });
            } else if (error.name === 'SequelizeUniqueConstraintError') {
                // Handle unique constraint violations (e.g., email/username already in use)
                console.error("Unique constraint error updating user:", error.errors[0].message);
                return res.status(400).json({ message: 'Email/username already in use', error: error.errors[0].message });
            } else {
                // Generic error handling for unexpected issues
                console.error("Unexpected error updating user:", error);
                return res.status(500).json({ message: 'An unexpected error occurred while updating user', error: error.message });
            }
        }
    },
    


    async updatePassword(req, res) {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;

        console.log(`Received request to update password for user with ID: ${id}`);
        console.log("Request body:", { oldPassword, newPassword });

        try {
            // Find the user by ID
            const user = await User.findByPk(id);
            if (!user) {
                console.warn(`User with ID ${id} not found.`);
                return res.status(404).json({ message: 'User not found' });
            }

            console.log(`User found:`, user);

            // Verify the old password using bcrypt
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
                console.warn(`Old password is incorrect for user with ID ${id}.`);
                return res.status(400).json({ message: 'Old password is incorrect' });
            }

            console.log("Old password verified successfully.");

            // Set the new password (the hook will hash it before saving)
            user.password = newPassword;

            // Save the updated user with the new password
            await user.save();

            console.log("Password updated successfully for user:", user);
            res.status(200).json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error("Error updating password:", error);
            res.status(500).json({ message: 'Error updating password', error: error.message });
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

            // Create entries in Assignment for each patient-student relationship with status 'assigned'
            const assignments = patientIds.map(patientId => ({
                userId: studentId,
                patientId,
                status: 'assigned', // Set status as 'assigned'
            }));

            // Bulk create the relationships in Assignment table
            await Assignment.bulkCreate(assignments, { ignoreDuplicates: true });

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
                            attributes: ['status'], // Include only the 'status' from Assignment
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