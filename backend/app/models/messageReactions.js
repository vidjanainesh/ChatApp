const sequelize = require('./database');
const { DataTypes } = require('sequelize');

const MessageReactions = sequelize.define('message_reactions', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    target_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    target_type: {
        type: DataTypes.ENUM('private', 'group'),
        allowNull: false
    },
    reaction: {
        type: DataTypes.STRING,
        allowNull: false
        // You can enforce a set: ENUM('❤️', '😂', '👍', etc.) if needed
    }
}, {
    tableName: 'message_reactions',
    timestamps: true
});

module.exports = MessageReactions;