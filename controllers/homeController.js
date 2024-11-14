import { where } from 'sequelize';
import { User, Patient, Assignment } from '../models/index.js';

// Controller for handling home operations
const homeController = {
    // Get stats for Users, Patients, and other hardcoded values
    async getStats(req, res) {
        try {
            // Get count for User and Patient tables
            const userCount = await User.count({
                where: {
                    isAdmin: false,
                },
            });
            const patientCount = await Patient.count();

            // Hardcoded stats
            const assessmentsCount = await Assignment.count({
                where: {
                    status: 'marked',
                }
            }); // For demonstration purposes, this is hardcoded
            const interactionCount = await Assignment.count({
                where: {
                    status: ['inprogress', 'completed', 'marked'], // Array of possible values for the status column
                }
            });
            

            // Prepare JSON response
            const stats = {
                users: userCount,
                patients: patientCount,
                assessments: assessmentsCount,
                interactions: interactionCount
            };

            // Send response
            res.status(200).json(stats);
        } catch (error) {
            console.error("Error retrieving stats:", error);
            res.status(500).json({ message: 'Error retrieving stats', error: error.message });
        }
    },
};

export default homeController;
