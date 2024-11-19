import { DataTypes, Model } from 'sequelize';

export default function initApiKeyModel(sequelize) {
    class ApiKey extends Model {}

    ApiKey.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        keyName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        apiKey: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        service: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        modelId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Foreign key referencing the ChatGPTModel table.',
        },
        usageLimit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Optional limit on how many times the key can be used.',
        },
        usageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            comment: 'Tracks the number of times this API key has been used.',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            comment: 'Indicates if the key is active.',
        },
    }, {
        sequelize,
        modelName: 'ApiKey',
        tableName: 'api_keys',
        timestamps: true,
        paranoid: true,
    });

    return ApiKey;
}
