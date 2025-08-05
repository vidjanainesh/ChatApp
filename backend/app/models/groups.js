const sequelize = require('./database');
const { DataTypes } = require('sequelize');

const Groups = sequelize.define('groups', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  super_admin: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  admin: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  group_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

module.exports = Groups;