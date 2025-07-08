'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('group_messages', 'file_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('group_messages', 'file_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('group_messages', 'file_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('group_messages', 'file_size', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('group_messages', 'file_blur_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('group_messages', 'file_url');
    await queryInterface.removeColumn('group_messages', 'file_type');
    await queryInterface.removeColumn('group_messages', 'file_name');
    await queryInterface.removeColumn('group_messages', 'file_size');
    await queryInterface.removeColumn('group_messages', 'file_blur_url');
  }
};