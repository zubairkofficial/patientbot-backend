import { Patient, Symptom } from '../models/index.js';

const patientController = {
    // Get all patients with symptoms
    async getAllPatients(req, res) {
        try {
            const patients = await Patient.findAll({
                include: [
                    {
                        model: Symptom,
                        through: { attributes: [] }, // Exclude PatientSymptom fields if not needed
                    },
                ],
            });
            res.status(200).json(patients);
        } catch (error) {
            console.error('Error fetching patients:', error);
            res.status(500).json({ error: 'An error occurred while fetching patients' });
        }
    },

    // Create a new patient with symptoms
    async createPatient(req, res) {
        const { name, prompt, answer, symptoms } = req.body;

        if (!name || !prompt || !answer || !Array.isArray(symptoms)) {
            return res.status(400).json({ message: 'Name, prompt, answer, and symptoms are required.' });
        }

        try {
            const newPatient = await Patient.create({ name, prompt, answer });

            if (symptoms.length > 0) {
                const symptomRecords = await Symptom.findAll({
                    where: { id: symptoms },
                });
                await newPatient.addSymptoms(symptomRecords);
            }

            res.status(201).json({ message: 'Patient created successfully', patient: newPatient });
        } catch (error) {
            console.error('Error creating patient:', error);
            res.status(500).json({ error: 'An error occurred while creating the patient' });
        }
    },

    // Update a patient
    async updatePatient(req, res) {
        const { id } = req.params;
        const { name, prompt, answer, symptoms } = req.body;
    
        // Validate only name, prompt, and answer fields
        if (!name || !prompt || !answer) {
            return res.status(400).json({ message: 'Name, prompt, and answer are required.' });
        }
    
        try {
            const patient = await Patient.findByPk(id);
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }
    
            // Update patient details
            await patient.update({ name, prompt, answer });
    
            // Update symptoms associations only if symptoms are provided
            if (symptoms && Array.isArray(symptoms) && symptoms.length > 0) {
                const symptomRecords = await Symptom.findAll({
                    where: { id: symptoms },
                });
                await patient.setSymptoms(symptomRecords); // Replaces existing associations with new ones
            }
    
            res.status(200).json({ message: 'Patient updated successfully', patient });
        } catch (error) {
            console.error('Error updating patient:', error);
            res.status(500).json({ error: 'An error occurred while updating the patient' });
        }
    },
    
    // Delete a patient
    async deletePatient(req, res) {
        const { id } = req.params;

        try {
            const patient = await Patient.findByPk(id);
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Delete patient record
            await patient.destroy();

            res.status(200).json({ message: 'Patient deleted successfully' });
        } catch (error) {
            console.error('Error deleting patient:', error);
            res.status(500).json({ error: 'An error occurred while deleting the patient' });
        }
    },
};

export default patientController;
