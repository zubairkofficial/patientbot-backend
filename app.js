import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js'; // Ensure to include the .js extension
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js'
import symptomRoutes from './routes/symptomRoutes.js'
import assignmentRoutes from './routes/assignmentRoutes.js'
import homeRoutes from './routes/homeRoutes.js'
const app = express();

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Define routes for user and authentication management
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/symptoms', symptomRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/home', homeRoutes);

export default app; // Use export default instead of module.exports