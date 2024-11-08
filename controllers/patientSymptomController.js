import {PatientSymptom} from '../models/PatientSymptom.js';
import Patient from '../models/Patient.js';
import Symptom from '../models/Symptom.js';

export async function getPatientSymptoms(req, res) {
    try {
        const patientSymptoms = await PatientSymptom.findAll({
            // include: [
            //     { model: Patient, attributes: ['id', 'name'] },
            //     { model: Symptom, attributes: ['id', 'name'] }
            // ]
        });
        res.json(patientSymptoms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching patient symptoms' });
    }
}
