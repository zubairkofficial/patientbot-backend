import express from 'express';
import { getUser } from '../controllers/userController.js'; // Ensure to include the .js extension

const router = express.Router();

router.get('/:id', getUser);

export default router; // Use export default instead of module.exports