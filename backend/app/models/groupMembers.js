const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const GroupMembers = sequelize.define('group_members', {
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
});

module.exports = GroupMembers;