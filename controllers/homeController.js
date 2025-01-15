import { where } from "sequelize";
import { User, Patient, Assignment } from "../models/index.js";

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
          status: "marked",
        },
      }); // For demonstration purposes, this is hardcoded
      const interactionCount = await Assignment.count({
        where: {
          status: ["inprogress", "completed", "marked"], // Array of possible values for the status column
        },
      });

      // Prepare JSON response
      const stats = {
        users: userCount,
        patients: patientCount,
        assessments: assessmentsCount,
        interactions: interactionCount,
      };

      // Send response
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error retrieving stats:", error);
      res
        .status(500)
        .json({ message: "Error retrieving stats", error: error.message });
    }
  },
  // ... existing code ...

  async getRecentAssessments(req, res) {
    console.log("Fetching recent assessments");
    try {
      // Fetch recent assignments with related student and patient details where status is 'marked'
      const assignments = await Assignment.findAll({
        where: {
          status: "marked", // Only get assignments with status 'marked'
        },
        include: [
          {
            model: User,
            attributes: ["id", "name"], // Fetch student details
          },
          {
            model: Patient,
            attributes: ["id", "name"], // Fetch patient details
          },
        ],
        attributes: ["id", "score", "createdAt"], // Include assignment ID, total score, and creation date
        order: [["createdAt", "DESC"]], // Order by creation date, most recent first
        limit: 5, // Limit to the most recent 10 assessments
      });

      // Map the data to structure it as needed
      // Map the data with null checks
      const response = assignments.map((assignment) => ({
        assignmentId: assignment.id,
        studentName: assignment.User?.name || "Test Student",
        patientName: assignment.Patient?.name || "Test Patient",
        totalScore: assignment.score || 0,
        createdAt: assignment.createdAt,
      }));

      res.status(200).json({ assessments: response });
    } catch (error) {
      console.error(
        "Error fetching recent assessments:",
        error.message,
        error.stack
      );
      res.status(500).json({
        message: "An error occurred while fetching recent assessments.",
      });
    }
  },
};

export default homeController;
