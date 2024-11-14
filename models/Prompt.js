// Prompt.js
import { DataTypes, Model } from 'sequelize';

export default function initPromptModel(sequelize) {

    class Prompt extends Model { }
    Prompt.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        mandatoryQuestions: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        medicalHistory: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        predefinedTreatments: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'patients', // Name of the table to reference
                key: 'id',         // Name of the column to reference
            },
            onDelete: 'CASCADE', // Optionally, specify cascade behavior on delete
        },
    }, {
        sequelize,
        modelName: 'Prompt',
        tableName: 'prompts',
        timestamps: true,
        paranoid: true,
    });

    return Prompt;
}
