const { Sequelize } = require('sequelize');
require('dotenv').config(); 

const db = process.env.DB;
const config = require('../config/config')[db];

// console.log(`DB: ${db}`);
// console.log('Config:', config);

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        dialect: config.dialect,
        logging: false
    }
);

module.exports = sequelize;