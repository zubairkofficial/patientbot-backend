import app from './app.js';
import sync from './config/sync.js'; // Import the sync function
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000; // Fallback to port 3000 if not specified

// Sync database and then start the server
const startServer = async () => {
    // await sync(); // Sync the database first
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error('Error starting the server:', error);
});