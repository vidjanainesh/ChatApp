const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const GroupMessages = sequelize.define('group_messages', {
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
});

module.exports = GroupMessages;