const { Sequelize } = require('sequelize');
const dns = require('dns');
require('dotenv').config();

dns.setDefaultResultOrder('ipv4first');

const db = process.env.DB || 'development';
const config = require('../../config/config')[db];

// console.log(`DB: ${db}`);
// console.log('Config:', config);

const sequelize = new Sequelize(config);  

module.exports = sequelize;