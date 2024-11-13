// src/controllers/langchainController.js

import { calculateScore, extractInformation, extractInformationSummary } from "../services/openaiService.js";
import { Assignment, Patient, Symptom } from "../models/index.js"; // Import Symptom model
    
// Utility function to clean conversation log data
function cleanConversationLog(conversationLog) {
    const conversation = JSON.parse(conversationLog);
    return conversation
        .map(entry => {
            const prefix = entry.isAI ? "AI: " : "Student: ";
            return `${prefix}${entry.text}`;
        })
        .join("\n");
}

// Controller function to handle the extraction logic
const openaiController = {
    async extractData(req, res) {
        try {
            const { patientId, studentId } = req.body;

            if (!patientId || !studentId) {
                return res.status(400).json({ error: "Both patientId and studentId are required." });
            }

            // Fetch the assignment from the database based on studentId and patientId
            const assignment = await Assignment.findOne({
                where: { userId: studentId, patientId: patientId }
            });

            if (!assignment) {
                return res.status(404).json({ error: "Assignment not found." });
            }

            // Fetch the patient data from the database
            const patient = await Patient.findByPk(patientId);
            if (!patient) {
                return res.status(404).json({ error: "Patient not found." });
            }

            // Fetch related symptoms for the patient
            const symptoms = await Symptom.findAll({
                include: {
                    model: Patient,
                    where: { id: patientId },
                    through: { attributes: [] } // Exclude join table attributes if not needed
                }
            });

            // Format symptoms data
            const formattedSymptoms = symptoms.map(symptom =>
                `Name: ${symptom.name}, Severity: ${symptom.severity}, Description: ${symptom.description}`
            ).join("\n");

            // Clean and format the conversation log
            const cleanedConversationLog = cleanConversationLog(assignment.conversationLog);

            // Combine cleaned conversation log and findings as studentData
            const studentData = `
                Conversation Log:
                ${cleanedConversationLog}
                
                Diagnosis & Treatments by Student:
                ${assignment.findings}
            `;

            // Format patientData string based on patient data values and symptoms
            const patientData = `
                Patient ID: ${patient.dataValues.id}
                Name: ${patient.dataValues.name}
                Treatments, Mandatory Questions and Medical History: ${patient.dataValues.prompt}
                Correct Diagnosis: ${patient.dataValues.answer}
                Symptoms:
                ${formattedSymptoms.toString()}
            `;

            const suggestedData = JSON.stringify(studentData);
            const predefinedData = JSON.stringify(patientData);

            console.log("Student Data", suggestedData);
            console.log("Predefined Data", predefinedData);

            // Call the extractInformation function
            const structuredData = await extractInformation(suggestedData, predefinedData);
            const summary = await extractInformationSummary(suggestedData, predefinedData);
            console.log(structuredData);
            console.log("Summary", summary);
            //const result = await calculateScore(summary);

            return res.json({
                structuredData,
                summary
            });
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ error: "An error occurred while processing the data." });
        }
    }
};

export default openaiController;