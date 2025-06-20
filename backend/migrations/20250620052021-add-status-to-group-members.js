'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('group_members', 'status', {
      type: Sequelize.ENUM('active', 'left'),
      defaultValue: 'active',
      allowNull: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('group_members', 'status');
  }
};