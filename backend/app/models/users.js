const sequelize = require('./database');
const { DataTypes } = require('sequelize');

const User = sequelize.define('users', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone_no: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    token: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    token_expires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    profile_image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    profile_image_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    profile_image_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    profile_image_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    profile_image_blur_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    profile_image_blur_width: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    profile_image_blur_height: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true,
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },

});

module.exports = User;