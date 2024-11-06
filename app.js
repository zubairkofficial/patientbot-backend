import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js'; // Ensure to include the .js extension
import authRoutes from './routes/authRoutes.js'
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);

export default app; // Use export default instead of module.exports