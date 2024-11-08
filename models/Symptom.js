import { DataTypes, Model } from 'sequelize';


export default function initSymptomModel(sequelize) {

    class Symptom extends Model {

    }
    Symptom.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        severity: {
            type: DataTypes.ENUM('mild', 'moderate', 'severe'),
            allowNull: false,
            validate: {
                isIn: {
                    args: [['mild', 'moderate', 'severe']],
                    msg: 'Severity must be one of: mild, moderate, severe',
                },
            },
        },
    }, {
        sequelize,
        modelName: 'Symptom',
        tableName: 'symptoms',
        timestamps: true,
        paranoid: true,
    });

    return Symptom;
}
