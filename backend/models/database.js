const { Sequelize } = require('sequelize');
require('dotenv').config();

const db = process.env.DB || 'development';
const config = require('../config/config')[db];

// console.log(`DB: ${db}`);
// console.log('Config:', config);

const sequelize = new Sequelize(config);  

module.exports = sequelize;