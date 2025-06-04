const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const Friends = sequelize.define('Friends', {
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
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
  indexes: [
    {
      unique: true,
      fields: ['sender_id', 'receiver_id']
    }
  ]
});

module.exports = Friends;