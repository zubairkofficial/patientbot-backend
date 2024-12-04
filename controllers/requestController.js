import { Assignment, Prompt } from '../models/index.js';
import { Patient } from '../models/index.js';
import { User } from '../models/index.js';
import { Symptom } from '../models/index.js';
import { Op } from 'sequelize';

const requestController = {
    // ... existing methods ...

    async requestReattempt(req, res) {
        const { studentId, patientId } = req.body;

        // Validate input
        if (!studentId || !patientId) {
            return res.status(400).json({ message: 'Student ID and Patient ID are required.' });
        }

        try {
            // Find the assignment associated with the student and patient
            const assignment = await Assignment.findOne({
                where: {
                    userId: studentId,
                    patientId: patientId,
                },
            });

            // Check if assignment exists
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found for the given student and patient.' });
            }

            // Set the request status to pending
            assignment.requestStatus = 'pending';
            await assignment.save();

            console.log(`Re-attempt request from student ${studentId} for patient ${patientId} set to pending`);

            res.status(200).json({ message: 'Re-attempt request submitted successfully.', requestStatus: assignment.requestStatus });
        } catch (error) {
            console.error('Error requesting re-attempt:', error);
            res.status(500).json({ message: 'An error occurred while requesting re-attempt.' });
        }
    },

    async handleReattemptRequest(req, res) {
        const { assignmentId, action } = req.body; // action can be 'accept' or 'reject'

        // Validate input
        if (!assignmentId || !action) {
            return res.status(400).json({ message: 'Assignment ID and action are required.' });
        }

        try {
            // Find the assignment
            const assignment = await Assignment.findByPk(assignmentId);

            // Check if assignment exists
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found.' });
            }

            if (action === 'accept') {
                // Clear conversation log and findings
                assignment.conversationLog = null;
                assignment.findings = null;
                assignment.requestStatus = 'accepted';
                assignment.status = 'assigned';// Update request status to accepted
                await assignment.save();
                res.status(200).json({ message: 'Re-attempt request accepted. Assignment cleared for re-attempt.' });
            } else if (action === 'decline') {
                assignment.requestStatus = 'declined'; // Update request status to declined
                await assignment.save();

                res.status(200).json({ message: 'Re-attempt request rejected. Assignment remains unchanged.' });
            } else {
                return res.status(400).json({ message: 'Invalid action. Use "accept" or "reject".' });
            }
        } catch (error) {
            console.error('Error handling re-attempt request:', error);
            res.status(500).json({ message: 'An error occurred while handling the re-attempt request.' });
        }
    },

    async getAllReattemptRequests(req, res) {
        try {
            console.log("Fetching all pending re-attempt requests");

            // Fetch all assignments where the requestStatus is 'pending'
            const requests = await Assignment.findAll({
                where: {
                    requestStatus: 'pending',  // Only fetch requests with 'pending' status
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name'],  // Include the student's name
                    },
                    {
                        model: Patient,
                        attributes: ['id', 'name'],  // Include the patient's name
                    }
                ],
                attributes: [
                    'id', 'status', 'dueDate', 'score', 'feedback', 'findings', 'conversationLog',
                    'userId', 'patientId', 'requestStatus'
                ],
            });

            if (requests.length === 0) {
                return res.status(404).json({ message: 'No pending re-attempt requests found.' });
            }

            // Format the data to include student and patient names
            const formattedRequests = requests.map((assignment) => {
                return {
                    assignmentId: assignment.id,
                    status: assignment.status,
                    dueDate: assignment.dueDate,
                    score: assignment.score,
                    feedback: assignment.feedback,
                    findings: assignment.findings,
                    conversationLog: assignment.conversationLog,
                    requestStatus: assignment.requestStatus,
                    student: {
                        id: assignment.User.id,
                        name: assignment.User.name,  // Student's name
                    },
                    patient: {
                        id: assignment.Patient.id,
                        name: assignment.Patient.name,  // Patient's name
                    },
                };
            });

            // Return the formatted data
            res.status(200).json({ requests: formattedRequests });
        } catch (error) {
            console.error('Error fetching all re-attempt requests:', error);
            res.status(500).json({ message: 'An error occurred while fetching all re-attempt requests.' });
        }
    },

    async getReattemptRequestsByCreator(req, res) {
        const { creatorId } = req.params;

        // Validate input
        if (!creatorId) {
            return res.status(400).json({ message: 'Creator ID is required.' });
        }

        try {
            console.log(`Fetching re-attempt requests for creator: ${creatorId}`);

            // Fetch all assignments with requestStatus 'pending' for the given creatorId
            const requests = await Assignment.findAll({
                where: {
                    creatorId: creatorId,  // Filter assignments by creatorId
                    requestStatus: { [Op.ne]: null },  // Ensure requestStatus is not null
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name'],  // Include the student's name
                    },
                    {
                        model: Patient,
                        attributes: ['id', 'name'],  // Include the patient's name
                    }
                ],
                attributes: [
                    'id', 'status', 'dueDate', 'score', 'feedback', 'findings', 'conversationLog',
                    'userId', 'patientId', 'requestStatus', 'creatorId'
                ],
            });

            if (requests.length === 0) {
                return res.status(404).json({ message: 'No pending re-attempt requests found for the given creator.' });
            }

            // Format the data to include student and patient names
            const formattedRequests = requests.map((assignment) => {
                return {
                    assignmentId: assignment.id,
                    status: assignment.status,
                    dueDate: assignment.dueDate,
                    score: assignment.score,
                    feedback: assignment.feedback,
                    findings: assignment.findings,
                    conversationLog: assignment.conversationLog,
                    requestStatus: assignment.requestStatus,
                    student: {
                        id: assignment.User.id,
                        name: assignment.User.name,  // Student's name
                    },
                    patient: {
                        id: assignment.Patient.id,
                        name: assignment.Patient.name,  // Patient's name
                    },
                };
            });

            // Return the formatted data
            res.status(200).json({ requests: formattedRequests });
        } catch (error) {
            console.error('Error fetching re-attempt requests by creator:', error);
            res.status(500).json({ message: 'An error occurred while fetching re-attempt requests by creator.' });
        }
    }

    // ... existing methods ...
};
export default requestController;
