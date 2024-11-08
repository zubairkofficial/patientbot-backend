import { DataTypes, Model } from 'sequelize';

export default function initPatientUserModel(sequelize) {
    class PatientUser extends Model {}

    PatientUser.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'patients', // Lowercase table name
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users', // Lowercase table name
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        status: {
            type: DataTypes.ENUM('assigned', 'completed', 'marked'),
            allowNull: false,
            defaultValue: 'assigned', // Default to 'assigned' when a new record is created
        },
    }, {
        sequelize,
        modelName: 'PatientUser',
        tableName: 'patient_users',
        timestamps: true,
    });
    
    return PatientUser;
}
