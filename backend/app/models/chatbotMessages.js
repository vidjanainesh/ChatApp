const sequelize = require('./database');
const { DataTypes } = require('sequelize');

const ChatbotMessages = sequelize.define('chatbot_messages', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sender_message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    chatbot_reply: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    iv: {
        type: DataTypes.STRING(32),
        allowNull: true,
    },
    conversation_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = ChatbotMessages;
