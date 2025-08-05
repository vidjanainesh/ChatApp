'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      // Rename created_by to admin
      queryInterface.renameColumn('groups', 'created_by', 'admin'),

      // Add group_image_url field
      queryInterface.addColumn('groups', 'group_image_url', {
        type: Sequelize.TEXT,
        allowNull: true,
      })
    ]);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      // Rollback rename
      queryInterface.renameColumn('groups', 'admin', 'created_by'),

      // Remove group_image_url field
      queryInterface.removeColumn('groups', 'group_image_url')
    ]);
  }
};