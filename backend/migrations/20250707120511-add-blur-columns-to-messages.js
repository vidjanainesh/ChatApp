"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('messages', 'file_blur_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('messages', 'file_blur_width', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('messages', 'file_blur_height', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('messages', 'file_blur_url');
    await queryInterface.removeColumn('messages', 'file_blur_width');
    await queryInterface.removeColumn('messages', 'file_blur_height');
  }
};
