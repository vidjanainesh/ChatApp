const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const Message = sequelize.define('Message', {
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
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
});

module.exports = Message;