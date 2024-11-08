import { DataTypes, Model } from 'sequelize';

export class PatientSymptom extends Model {}

export default function initPatientSymptomModel(sequelize) {
    PatientSymptom.init({
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
        symptomId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'symptoms', // Lowercase table name
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    }, {
        sequelize,
        modelName: 'PatientSymptom',
        tableName: 'patient_symptoms',
        timestamps: true,
    });
    
    return PatientSymptom;
}
