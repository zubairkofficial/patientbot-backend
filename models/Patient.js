import { DataTypes, Model } from 'sequelize';

export default function initPatientModel(sequelize) {
    class Patient extends Model {}

    Patient.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Ensure the name is unique for each patient
        },
        answer: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Ensure the slug is unique for each patient
        },
    }, {
        sequelize,
        modelName: 'Patient',
        tableName: 'patients',
        timestamps: true,
        paranoid: true,
    });

    // Define a hook to generate the slug before creating a new patient
    Patient.beforeCreate(async (patient) => {
        // Generate slug by transforming the name to lowercase and removing spaces
        const slug = patient.name.toLowerCase().replace(/\s+/g, '');

        // Check if a patient with the same slug already exists
        const existingPatient = await Patient.findOne({ where: { slug } });
        if (existingPatient) {
            throw new Error('A patient with the same name already exists. Please use a different name.');
        }

        patient.slug = slug;
    });

    return Patient;
}
