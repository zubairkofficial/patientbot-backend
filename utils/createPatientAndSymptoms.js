import sequelize from '../models/index.js';
import initPatientModel, { Patient } from '../models/Patient.js';
import initSymptomModel, { Symptom } from '../models/Symptom.js';
import initPatientSymptomModel from '../models/PatientSymptom.js';

const initializeModels = () => {
    initPatientModel(sequelize);
    initSymptomModel(sequelize);
    initPatientSymptomModel(sequelize);
};

const createPatientsAndSymptoms = async () => {
    try {
        await sequelize.authenticate(); // Establish database connection
        initializeModels();

        // Ensure table sync (use force: true if tables are empty)
        await sequelize.sync();

        // Create Patients
        const patients = await Patient.bulkCreate([
            { name: 'John Doe', prompt: 'Headache severity?', answer: 'Severe headache' },
            { name: 'Jane Smith', prompt: 'Experiencing nausea?', answer: 'Moderate nausea' },
            { name: 'Alice Johnson', prompt: 'Cough severity?', answer: 'Severe cough' },
        ]);

        // Create Symptoms
        const symptoms = await Symptom.bulkCreate([
            { name: 'Headache', description: 'Intense headache', severity: 'severe' },
            { name: 'Nausea', description: 'Feeling of sickness', severity: 'moderate' },
            { name: 'Cough', description: 'Dry cough', severity: 'mild' },
            { name: 'Fatigue', description: 'Feeling tired', severity: 'moderate' },
            { name: 'Shortness of breath', description: 'Difficulty breathing', severity: 'severe' },
            { name: 'Fever', description: 'High temperature', severity: 'moderate' },
        ]);

        // Assign symptoms to each patient
        for (const patient of patients) {
            // Randomly select 4 symptoms for each patient
            const assignedSymptoms = symptoms.sort(() => 0.5 - Math.random()).slice(0, 4);
            await patient.addSymptoms(assignedSymptoms);
        }

        console.log('Patients and Symptoms created and associated successfully.');
    } catch (error) {
        console.error('Error creating patients and symptoms:', error);
    } finally {
        await sequelize.close();
    }
};

createPatientsAndSymptoms();
