import { DataTypes, Model as SequelizeModel } from 'sequelize';

export default function initChatGPTModel(sequelize) {
    class ChatGPTModel extends SequelizeModel {}

    ChatGPTModel.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        modelName: {
            type: DataTypes.STRING,
            allowNull: false, // Enforce non-null values
            unique: false,     // Enforce uniqueness
            comment: 'Name of the ChatGPT model, e.g., gpt-4, gpt-3.5-turbo.',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Optional description of the model and its capabilities.',
        },
        maxTokens: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Maximum number of tokens supported by the model.',
        },
    }, {
        sequelize,
        modelName: 'ChatGPTModel',
        tableName: 'chatgpt_models',
        timestamps: true,
        paranoid: true,
    });

    return ChatGPTModel;
}
