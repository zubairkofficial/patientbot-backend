// models/User.js
import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';



export default function initUserModel(sequelize) {
    class User extends Model {
        // Add a hook to hash the password before saving
        static async hashPassword(user) {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }

        // Method to check password validity
        async isValidPassword(password) {
            return bcrypt.compare(password, this.password);
        }
    }


    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isSuperAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true, // Can be null if not yet verified
        },

    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        hooks: {
            beforeSave: User.hashPassword, // Hook to hash password before saving
        },
        paranoid: true, // Enable soft deletes (adds deletedAt timestamp)
    });
    return User;
}