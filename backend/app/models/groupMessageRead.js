const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const GroupMessageRead = sequelize.define('group_message_read', {
    group_message_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    read_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
});

module.exports = GroupMessageRead;