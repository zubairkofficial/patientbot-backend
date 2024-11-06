import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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
                user.password = await bcrypt.hash(password, 10);
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
    }
};

export default userController;