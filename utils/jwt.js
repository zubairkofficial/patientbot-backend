// utils/jwt.js
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET;

// Generate a JWT token
export const generateToken = (userId) => {
    return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
};

// Verify a JWT token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        return null;
    }
};