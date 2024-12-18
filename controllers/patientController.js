import { Patient, Symptom, Prompt } from "../models/index.js";

const patientController = {
  // Get all patients with symptoms and prompts
  async getAllPatients(req, res) {
    try {
      const patients = await Patient.findAll({
        include: [
          {
            model: Symptom,
            through: { attributes: [] }, // Exclude PatientSymptom fields if not needed
          },
          {
            model: Prompt,
            attributes: [
              "mandatoryQuestions",
              "medicalHistory",
              "predefinedTreatments",
            ], // Include relevant fields from Prompt
          },
        ],
      });
      res.status(200).json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching patients" });
    }
  },

  // Create a new patient with symptoms and prompts
  // Create a new patient with symptoms and prompts
  async createPatient(req, res) {
    const {
      name,
      answer,
      symptoms,
      mandatoryQuestions,
      medicalHistory,
      predefinedTreatments,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !medicalHistory ||
      !predefinedTreatments ||
      !answer ||
      !Array.isArray(symptoms)
    ) {
      return res.status(400).json({
        message: "All the fields are required to create patient.",
      });
    }

    try {
      // Generate slug by transforming the name to lowercase and removing spaces
      let slug = name.toLowerCase().replace(/\s+/g, "");

      // Check if a patient with the same slug already exists
      const existingPatient = await Patient.findOne({ where: { slug } });
      if (existingPatient) {
        return res.status(400).json({
          message:
            "A patient with the same name already exists. Please use a different name.",
        });
      }

      // Create a new patient with the generated slug
      const newPatient = await Patient.create({ name, answer, slug });
      const newPatientId = newPatient.id;

      // Set mandatoryQuestions to empty string if not provided
      const promptMandatoryQuestions = mandatoryQuestions || ""; // Default to empty string if not provided

      // Create the prompt associated with the patient
      const newPrompt = await Prompt.create({
        patientId: newPatientId,
        mandatoryQuestions: promptMandatoryQuestions, // Use the default empty string if not provided
        medicalHistory,
        predefinedTreatments,
      });

      // If symptoms are provided, associate them with the patient
      if (symptoms.length > 0) {
        const symptomRecords = await Symptom.findAll({
          where: { id: symptoms },
        });
        await newPatient.addSymptoms(symptomRecords);
      }

      res.status(201).json({
        message: "Patient and associated prompt created successfully",
        patient: newPatient,
        prompt: newPrompt,
      });
    } catch (error) {
      console.error("Error creating patient and prompt:", error);
      res
        .status(500)
        .json({
          error: "An error occurred while creating the patient and prompt",
        });
    }
  },

  // Update a patient
  // Update a patient
  async updatePatient(req, res) {
    const { id } = req.params;
    const {
      name,
      answer,
      symptoms,
      mandatoryQuestions,
      medicalHistory,
      predefinedTreatments,
    } = req.body;

    // Validate required fields
    if (
      !name &&
      !answer &&
      !symptoms &&
      !mandatoryQuestions &&
      !medicalHistory &&
      !predefinedTreatments
    ) {
      return res
        .status(400)
        .json({ message: "At least one field must be provided to update." });
    }

    try {
      const patient = await Patient.findByPk(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Update patient details if fields are provided
      if (name) {
        await patient.update({ name });
      }
      if (answer) {
        await patient.update({ answer });
      }

      // Update prompt details if fields are provided
      const prompt = await Prompt.findOne({ where: { patientId: id } });
      if (prompt) {
        if (mandatoryQuestions !== undefined) {
          // If mandatoryQuestions is provided, update it, else set to an empty string
          await prompt.update({ mandatoryQuestions: mandatoryQuestions || "" });
        }
        if (medicalHistory) {
          await prompt.update({ medicalHistory });
        }
        if (predefinedTreatments) {
          await prompt.update({ predefinedTreatments });
        }
      }

      // Update symptoms associations if symptoms are provided
      if (symptoms && Array.isArray(symptoms) && symptoms.length > 0) {
        const symptomRecords = await Symptom.findAll({
          where: { id: symptoms },
        });
        await patient.setSymptoms(symptomRecords); // Replaces existing associations with new ones
      }

      res
        .status(200)
        .json({ message: "Patient updated successfully", patient });
    } catch (error) {
      console.error("Error updating patient:", error);
      res
        .status(500)
        .json({ error: "An error occurred while updating the patient" });
    }
  },

  // Delete a patient
  async deletePatient(req, res) {
    const { id } = req.params;

    try {
      const patient = await Patient.findByPk(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Delete the patient and associated prompt
      const prompt = await Prompt.findOne({ where: { patientId: id } });
      if (prompt) {
        await prompt.destroy();
      }

      await patient.destroy();

      res.status(200).json({ message: "Patient deleted successfully" });
    } catch (error) {
      console.error("Error deleting patient:", error);
      res
        .status(500)
        .json({ error: "An error occurred while deleting the patient" });
    }
  },
};

export default patientController;
