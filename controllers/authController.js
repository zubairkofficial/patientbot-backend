// controllers/authController.js
import { User } from '../models/index.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

// Function to send confirmation email

const sendConfirmationEmail = async (user) => {
    const token = String(crypto.randomBytes(32).toString('hex')); // Generate a unique token
    const verificationUrl = `${process.env.BACKEND_API_URL}auth/verify-email?token=${token}&email=${user.email}`;

    // Store the token in the user record for later verification (you might want to add a new field in your User model)
    user.verificationToken = token; // Make sure to update your User model to store this token
    await user.save();

    const transporter = nodemailer.createTransport({
        host: 'smtp.titan.email',
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS,
        to: user.email,
        subject: 'Welcome to PatientBot',
        html: `
            <p>Thank you for signing up! Please verify your email by clicking the button below:</p>
            <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;color:#fff;background-color:#007bff;text-decoration:none;border-radius:5px;">Verify Email</a>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Error sending email: ${error.message}`);
    }
};

export const signup = async (req, res) => {
    const { name, email, password, username } = req.body;

    // Validate all required fields
    if (!name || !email || !password || !username) {
        return res.status(400).json({ message: 'All fields are required: name, email, password, and username.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // Check if email already exists
        const existingUserByEmail = await User.findOne({ where: { email } });
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email is already in use.' });
        }

        // Check if username already exists
        const existingUserByUsername = await User.findOne({ where: { username } });
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'Username is already taken.' });
        }

        // Create the user
        const newUser = await User.create({
            name,
            email,
            username,
            password, // Assuming the User model has a hook to hash the password automatically
        });

        // Send confirmation email
        await sendConfirmationEmail(newUser);

        // Send success response
        res.status(201).json({
            message: 'Signed up successfully. Please check your email for verification.',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                isAdmin: newUser.isAdmin,
                isActive: newUser.isActive,
                isSuperAdmin: newUser.isSuperAdmin,
            },
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
};

export const verifyEmail = async (req, res) => {
    const { token, email } = req.query;

    try {
        // Find the user with the given email and token
        const user = await User.findOne({ where: { email, verificationToken: token } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification link.' });
        }

        // Activate the user account
        user.isActive = true;
        user.verificationToken = null; // Clear the token after verification
        await user.save();

        // Redirect to the frontend login page
        res.redirect(`${process.env.FRONTEND_BASE_URL}login`); // Adjust the URL as needed
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
};


export const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the account is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is not activated. Please verify your email.' });
        }

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a token (optional, if you want to use JWT for session management)
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '12h' });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
                isActive: user.isActive,
                isSuperAdmin: user.isSuperAdmin,
            },
            token, // Send the token back if needed
        });
    } catch (error) {
        console.error('Error signing in:', error);
        res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
};