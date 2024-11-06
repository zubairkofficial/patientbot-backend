// sync.js
import sequelize from '../models/index.js';
import initUserModel from '../models/User.js';

// Initialize User model with Sequelize instance
initUserModel(sequelize);

const syncDatabase = async () => {
    try {
        await sequelize.sync({ force: true, logging: false }); // Sync all models with the database
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
};

export default syncDatabase;