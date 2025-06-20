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
    },
    status: {
      type: DataTypes.ENUM("active", "left"),
      defaultValue: "active",
      allowNull: false,
    },

});

module.exports = GroupMembers;