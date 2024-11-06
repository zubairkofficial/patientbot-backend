// middleware/authMiddleware.js
import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = (req, res, next) => {
    // Remove the space after '?' to use optional chaining correctly
    const token = req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
};