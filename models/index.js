import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import initPatientModel from './Patient.js';
import initSymptomModel from './Symptom.js';
import initPatientSymptomModel from './PatientSymptom.js';
import initUserModel from './User.js';
import initAssignmentModel from './Assignment.js';
import initPromptModel from './Prompt.js'; // Import Prompt model

dotenv.config();

// Create a new Sequelize instance with database configurations
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    define: {
        logging: false,
        timestamps: true,
    },
});

// Initialize models
const Patient = initPatientModel(sequelize);
const Symptom = initSymptomModel(sequelize);
const PatientSymptom = initPatientSymptomModel(sequelize);
const User = initUserModel(sequelize);
const Assignment = initAssignmentModel(sequelize);
const Prompt = initPromptModel(sequelize); // Initialize Prompt model

// Set up associations
Patient.belongsToMany(Symptom, { through: PatientSymptom, foreignKey: 'patientId' });
Symptom.belongsToMany(Patient, { through: PatientSymptom, foreignKey: 'symptomId' });

Patient.belongsToMany(User, { through: Assignment, foreignKey: 'patientId' });
User.belongsToMany(Patient, { through: Assignment, foreignKey: 'userId' });

// Set up Prompt associations
Patient.hasOne(Prompt, { foreignKey: 'patientId' });
Prompt.belongsTo(Patient, { foreignKey: 'patientId' });

// Export models and sequelize instance
export { sequelize, Patient, Symptom, PatientSymptom, User, Assignment, Prompt };
export default sequelize;
