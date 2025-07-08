const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const GroupMessages = sequelize.define('group_messages', {
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM('text', 'system'),
        allowNull: false,
        defaultValue: 'text',
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    reply_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    file_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    file_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    file_blur_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
});

module.exports = GroupMessages;