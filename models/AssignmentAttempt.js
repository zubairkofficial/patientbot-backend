import { DataTypes, Model } from 'sequelize';

export default function initAssignmentAttemptModel(sequelize) {
    class AssignmentAttempt extends Model { }

    AssignmentAttempt.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        assignmentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'assignments',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        attemptNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        }
    }, {
        sequelize,
        modelName: 'AssignmentAttempt',
        tableName: 'assignment_attempts',
        timestamps: true,
    });

    return AssignmentAttempt;
}