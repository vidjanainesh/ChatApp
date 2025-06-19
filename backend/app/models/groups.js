const sequelize = require('./database');
const {DataTypes} = require('sequelize');

const Groups = sequelize.define('groups', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
});

module.exports = Groups;