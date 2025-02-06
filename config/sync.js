// sync.js
import sequelize from '../models/index.js';
import initUserModel from '../models/User.js';
import initPatientModel from '../models/Patient.js';
import initRoomModel from "../models/Room.js";
import initSymptomModel from '../models/Symptom.js';
import initPatientSymptomModel from '../models/PatientSymptom.js';
import initAssignmentModel from '../models/Assignment.js';
import initPromptModel from '../models/Prompt.js';
import initApiKeyModel from '../models/ApiKey.js';
import initChatGPTModel from '../models/ChatGPT.js';


// Initialize User model with Sequelize instance
initUserModel(sequelize);
initPatientModel(sequelize);
initSymptomModel(sequelize);
initPatientSymptomModel(sequelize);
initPromptModel(sequelize);
initAssignmentModel(sequelize);
initApiKeyModel(sequelize);
initChatGPTModel(sequelize);
initRoomModel(sequelize);

const syncDatabase = async () => {
    try {
        await sequelize.sync({ logging: false, alter:true }); // Sync all models with the database
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
};

export default syncDatabase;