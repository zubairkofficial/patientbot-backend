// controllers/symptomController.js
import { Symptom } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

// Controller for handling symptom operations
const symptomController = {
    // Create a new symptom
    async createSymptom(req, res) {
        const { name, description, severity } = req.body;

        // Input validation
        if (!name || !description || !severity) {
            return res.status(400).json({ message: 'Name, description, and severity are required fields.' });
        }

        // Validate severity value
        const allowedSeverities = ['mild', 'moderate', 'severe'];
        if (!allowedSeverities.includes(severity.toLowerCase())) {
            return res.status(400).json({ message: `Severity must be one of: ${allowedSeverities.join(', ')}.` });
        }

        try {
            // Optionally, check if a symptom with the same name already exists
            const existingSymptom = await Symptom.findOne({ 
                where: { 
                  name, 
                  severity 
                } 
              });
              
              if (existingSymptom) {
                return res.status(400).json({ message: 'A symptom with this name and severity already exists.' });
              }

            // Create symptom
            const newSymptom = await Symptom.create({
                id: uuidv4(),
                name,
                description,
                severity: severity.toLowerCase(),
            });

            res.status(201).json({ message: 'Symptom created successfully', symptom: newSymptom });
        } catch (error) {
            console.error('Error creating symptom:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    },

    // Get all symptoms
    async getAllSymptoms(req, res) {
        try {
            const symptoms = await Symptom.findAll();
            res.status(200).json(symptoms);
        } catch (error) {
            console.error('Error retrieving symptoms:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    },

    // Get a single symptom by ID
    async getSymptomById(req, res) {
        const { id } = req.params;

        try {
            if (!id) {
                return res.status(400).json({ message: 'Symptom ID is required.' });
            }

            const symptom = await Symptom.findByPk(id);
            if (!symptom) {
                return res.status(404).json({ message: 'Symptom not found' });
            }
            res.status(200).json(symptom);
        } catch (error) {
            console.error('Error retrieving symptom:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    },

    // Update symptom by ID
    async updateSymptom(req, res) {
        const { id } = req.params;
        const { name, description, severity } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Symptom ID is required.' });
        }

        // Validate severity if provided
        const allowedSeverities = ['mild', 'moderate', 'severe'];
        if (severity && !allowedSeverities.includes(severity.toLowerCase())) {
            return res.status(400).json({ message: `Severity must be one of: ${allowedSeverities.join(', ')}.` });
        }

        try {
            // Find the symptom by ID
            const symptom = await Symptom.findByPk(id);
            if (!symptom) {
                return res.status(404).json({ message: 'Symptom not found' });
            }

            // Optionally, check if the new name already exists for another symptom
            if (name && name !== symptom.name) {
                const existingSymptom = await Symptom.findOne({ where: { name } });
                if (existingSymptom) {
                    return res.status(400).json({ message: 'A symptom with this name already exists.' });
                }
            }

            // Update symptom fields
            symptom.name = name || symptom.name;
            symptom.description = description || symptom.description;
            symptom.severity = severity ? severity.toLowerCase() : symptom.severity;

            // Save the updated symptom
            await symptom.save();

            res.status(200).json({ message: 'Symptom updated successfully', symptom });
        } catch (error) {
            console.error('Error updating symptom:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    },

    // Delete symptom by ID
    async deleteSymptom(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Symptom ID is required.' });
        }

        try {
            const symptom = await Symptom.findByPk(id);
            if (!symptom) {
                return res.status(404).json({ message: 'Symptom not found' });
            }

            await symptom.destroy();
            res.status(200).json({ message: 'Symptom deleted successfully' });
        } catch (error) {
            console.error('Error deleting symptom:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
};

export default symptomController;
