import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if token is provided
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT secret key
        req.user = decoded; // Store user data in req.user for further use in controllers
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        res.status(403).json({ message: 'Invalid or expired token' });
    }
};

export default authMiddleware;