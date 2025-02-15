import {
  calculateScore,
  extractInformation,
  extractInformationSummary,
} from "../services/openaiService.js";
import { Assignment, Patient, Prompt, Symptom } from "../models/index.js"; // Import Symptom model
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
// Utility function to clean conversation log data
function cleanConversationLog(conversationLog) {
  const conversation = JSON.parse(conversationLog);
  return conversation
    ?.map((entry) => {
      const prefix = entry.isAI ? "AI: " : "Student: ";
      return `${prefix}${entry.text}`;
    })
    .join("\n");
}

const openaiController = {
  async extractData(req, res) {
    try {
      const { patientId, studentId } = req.body;

      if (!patientId || !studentId) {
        return res
          .status(400)
          .json({ error: "Both patientId and studentId are required." });
      }

      // Fetch the assignment from the database based on studentId and patientId
      const assignment = await Assignment.findOne({
        where: { userId: studentId, patientId: patientId },
      });

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found." });
      }

      // Fetch the patient data from the database
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found." });
      }
      console.log("Patient", patient);

      // Fetch related symptoms for the patient
      const symptoms = await Symptom.findAll({
        include: {
          model: Patient,
          where: { id: patientId },
          through: { attributes: [] }, // Exclude join table attributes if not needed
        },
      });
      console.log("Symptoms", symptoms);

      // Fetch prompt details related to the patient
      const prompts = await Prompt.findOne({
        where: {
          patientId: patientId,
        },
      });

      if (!prompts) {
        return res.status(404).json({ error: "Prompt not found." });
      }

      console.log("Prompts", prompts);

      // Format symptoms data
      const formattedSymptoms = symptoms
        .map(
          (symptom) =>
            `Name: ${symptom.name}, Severity: ${symptom.severity}, Description: ${symptom.description}`
        )
        .join("\n");

      // Clean and format the conversation log
      const cleanedConversationLog = cleanConversationLog(
        assignment.conversationLog
      );

      // Combine cleaned conversation log and findings as studentData
      const studentData = `
          Conversation Log:
          ${cleanedConversationLog}
          
          Diagnosis & Treatments by Student:
          ${assignment.findings}

          ${assignment.visitNote
          ? `Note:\n ${assignment.visitNote}`
          : ""
        }      `;

      // Format patientData string based on patient data values and symptoms
      const patientData = `
          Name: ${patient.name}
          Mandatory Questions: ${prompts.mandatoryQuestions}
          Predefined Treatments: ${prompts.predefinedTreatments}
          Medical History: ${prompts.medicalHistory}
          Correct Diagnosis: ${patient.answer}
          Symptoms:
          ${formattedSymptoms}
      `;

      const suggestedData = JSON.stringify(studentData);
      const predefinedData = JSON.stringify(patientData);

      console.log("Student Data", suggestedData);
      console.log("Predefined Data", predefinedData);

      // Call the extractInformation function
      const structuredData = await extractInformation(
        suggestedData,
        predefinedData
      );
      const summary = await extractInformationSummary(
        suggestedData,
        predefinedData
      );

      const result = await calculateScore(summary, structuredData);

      console.log("Data:", structuredData);
      console.log("Summary", summary);
      console.log("Result ", result);

      const jsonResult = JSON.parse(result);
      console.log("Result JSON", jsonResult);
      const feedbackString = JSON.stringify(jsonResult.feedback);
      // Update assignment status

      assignment.mandatoryQuestionScore = jsonResult.mandatory_question_score;
      assignment.symptomsScore = jsonResult.symptoms_score;
      assignment.treatmentScore = jsonResult.treatments_score;
      assignment.diagnosisScore = jsonResult.diagnosis_score;
      assignment.feedback = jsonResult.feedback;
      assignment.status = "marked";

      // Convert scores to numbers
      assignment.mandatoryQuestionScore = parseFloat(
        jsonResult.mandatory_question_score
      );
      assignment.symptomsScore = parseFloat(jsonResult.symptoms_score);
      assignment.treatmentScore = parseFloat(jsonResult.treatments_score);
      assignment.diagnosisScore = parseFloat(jsonResult.diagnosis_score);

      // Calculate total score
      assignment.score =
        assignment.mandatoryQuestionScore +
        assignment.symptomsScore +
        assignment.treatmentScore +
        assignment.diagnosisScore;

      // Assign remaining properties
      assignment.feedback = jsonResult.feedback;
      assignment.status = "marked";

      await assignment.save();

      return res.json({
        structuredData,
        summary,
        jsonResult,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  async extractDataMultiple(req, res) {
    try {
      const { patientId, studentIds } = req.body;

      if (!patientId || !studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({
          error: "patientId and an array of studentIds are required.",
        });
      }

      // Fetch patient data
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found." });
      }

      // Fetch prompt details
      const prompts = await Prompt.findOne({ where: { patientId } });
      if (!prompts) {
        return res.status(404).json({ error: "Prompt not found." });
      }

      // Fetch related symptoms for the patient
      const symptoms = await Symptom.findAll({
        include: {
          model: Patient,
          where: { id: patientId },
          through: { attributes: [] }, // Exclude join table attributes if not needed
        },
      });

      // Format symptoms data
      const formattedSymptoms = symptoms
        .map(
          (symptom) =>
            `Name: ${symptom.name}, Severity: ${symptom.severity}, Description: ${symptom.description}`
        )
        .join("\n");

      // Prepare predefined data
      const patientData = `
          Name: ${patient.name}
          Mandatory Questions: ${prompts.mandatoryQuestions}
          Predefined Treatments: ${prompts.predefinedTreatments}
          Medical History: ${prompts.medicalHistory}
          Correct Diagnosis: ${patient.answer}
          Symptoms:
          ${formattedSymptoms}
      `;
      const predefinedData = JSON.stringify(patientData);

      const results = [];

      for (const studentId of studentIds) {
        // Fetch student assignment
        const assignment = await Assignment.findOne({
          where: { userId: studentId, patientId },
        });

        if (!assignment) {
          results.push({ studentId, error: "Assignment not found." });
          continue;
        }

        // Clean and format student data
        const cleanedConversationLog = cleanConversationLog(
          assignment.conversationLog
        );
        const studentData = `
            Conversation Log:
            ${cleanedConversationLog}
            
            Diagnosis & Treatments by Student:
            ${assignment.findings}
        `;
        const suggestedData = JSON.stringify(studentData);

        // Call extractInformation and calculateScore
        const structuredData = await extractInformation(
          suggestedData,
          predefinedData
        );
        const summary = await extractInformationSummary(
          suggestedData,
          predefinedData
        );
        const result = await calculateScore(summary, structuredData);

        const jsonResult = JSON.parse(result);
        const feedbackString = JSON.stringify(jsonResult.feedback);

        // Update assignment status
        assignment.status = "marked";
        assignment.score = jsonResult.total_score;
        assignment.feedback = feedbackString;
        await assignment.save();

        results.push({
          studentId,
          structuredData,
          summary,
          totalScore: jsonResult.total_score,
          feedback: jsonResult.feedback,
        });
      }

      return res.json({ results });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  async updateAssignment(req, res) {
    try {
      const { assignmentId, feedback, scores } = req.body;

      if (!assignmentId || !feedback || !scores) {
        return res.status(400).json({
          error: "Assignment ID, feedback, and scores are required.",
        });
      }

      // Fetch the assignment from the database using the provided ID
      const assignment = await Assignment.findByPk(assignmentId);

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found." });
      }

      // Destructure and convert scores to numbers
      const {
        mandatoryQuestionScore,
        symptomsScore,
        treatmentScore,
        diagnosisScore,
      } = scores;

      // Check if any score is missing or not a number
      if (
        mandatoryQuestionScore == null ||
        symptomsScore == null ||
        treatmentScore == null ||
        diagnosisScore == null
      ) {
        return res.status(400).json({
          error:
            "All score fields (mandatoryQuestionScore, symptomsScore, treatmentScore, diagnosisScore) are required.",
        });
      }

      // Convert scores to numbers
      const mandatoryQuestionScoreNum = parseFloat(mandatoryQuestionScore);
      const symptomsScoreNum = parseFloat(symptomsScore);
      const treatmentScoreNum = parseFloat(treatmentScore);
      const diagnosisScoreNum = parseFloat(diagnosisScore);

      // Check for NaN values after conversion
      if (
        isNaN(mandatoryQuestionScoreNum) ||
        isNaN(symptomsScoreNum) ||
        isNaN(treatmentScoreNum) ||
        isNaN(diagnosisScoreNum)
      ) {
        return res.status(400).json({
          error: "All scores must be valid numbers.",
        });
      }

      // Calculate totalScore
      const totalScore =
        mandatoryQuestionScoreNum +
        symptomsScoreNum +
        treatmentScoreNum +
        diagnosisScoreNum;

      // Update assignment fields
      assignment.feedback = feedback;
      assignment.score = totalScore;
      assignment.mandatoryQuestionScore = mandatoryQuestionScoreNum;
      assignment.symptomsScore = symptomsScoreNum;
      assignment.treatmentScore = treatmentScoreNum;
      assignment.diagnosisScore = diagnosisScoreNum;

      await assignment.save();

      return res.json({
        message: "Assignment updated successfully.",
        assignment,
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      return res.status(500).json({
        error: error.message,
      });
    }
  },


  async openaiModels(req, res) {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OpenAI API key is missing" });
      }

      const response = await axios.get("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      res.status(200).json({ models: response.data.data });
    } catch (error) {
      console.error("Error fetching OpenAI models:", error);
      res.status(500).json({ error: "Failed to fetch OpenAI models" });
    }
  },

  async deepgramModel(req, res) {
    try {
      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Deepgram API key is missing" });
      }

      const response = await axios.get("https://api.deepgram.com/v1/models", {
        headers: { Authorization: `Token ${apiKey}` },
      });

      res.status(200).json({ models: response.data });
    } catch (error) {
      console.error("Error fetching Deepgram models:", error);
      res.status(500).json({ error: "Failed to fetch Deepgram models" });
    }
  }








};
export default openaiController;
