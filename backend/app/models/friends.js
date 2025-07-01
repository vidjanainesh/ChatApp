const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const Friends = sequelize.define('friends', {
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
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        allowNull: true,
        defaultValue: 'pending'
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