// utils/createAdmin.js
import sequelize from '../models/index.js';
import initUserModel, { User } from '../models/User.js';
import bcrypt from 'bcrypt';

// Initialize User model
initUserModel(sequelize);

const insertAdminUser = async () => {
    try {
        await sequelize.authenticate(); // Establish database connection

        // Ensure table sync (use force: true if tables are empty)
        await sequelize.sync();



        const adminUser = await User.create({
            name: 'admin',
            email: 'admin@gmail.com',
            password: '12345678',
            username: 'admin',
            isAdmin: true,
            isActive: true,
            isSuperAdmin: true,
        });

        console.log('Admin user created:', adminUser.toJSON());
    } catch (error) {
        console.error('Error inserting admin user:', error);
    } finally {
        await sequelize.close();
    }
};

insertAdminUser();