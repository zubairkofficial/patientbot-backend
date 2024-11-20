import { DataTypes, Model } from 'sequelize';

export default function initAssignmentModel(sequelize) {
    class Assignment extends Model {}

    Assignment.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'patients',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        status: {
            type: DataTypes.ENUM('assigned','inprogress', 'completed', 'marked'),
            allowNull: false,
            defaultValue: 'assigned',
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        mandatoryQuestionScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Score for mandatory questions asked (45%)',
        },
        symptomsScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Score for documented symptoms (40%)',
        },
        treatmentScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Score for suggested treatments (5%)',
        },
        diagnosisScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Score for suggested Diagnosis (10%)',
        },
        conversationLog: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Transcript or summary of the student-bot interaction',
        },
        findings: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Student’s diagnosis and findings',
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed feedback on performance, missed questions, etc.',
        },
    }, {
        sequelize,
        modelName: 'Assignment',
        tableName: 'assignments',
        timestamps: true,
    });
    
    return Assignment;
}
