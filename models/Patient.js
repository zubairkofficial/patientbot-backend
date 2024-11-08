import { DataTypes, Model } from 'sequelize';


export default function initPatientModel(sequelize) {

    class Patient extends Model { }
    Patient.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        prompt: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        answer: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'Patient',
        tableName: 'patients',
        timestamps: true,
        paranoid: true,
    });

    return Patient;
}
