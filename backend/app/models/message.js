const sequelize = require('./database');
const { DataTypes } = require('sequelize');

const Message = sequelize.define('messages', {
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
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
    file_blur_width: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    file_blur_height: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
});

module.exports = Message;