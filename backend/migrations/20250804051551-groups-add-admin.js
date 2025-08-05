'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      // Add new 'admin' column (nullable)
      queryInterface.addColumn('groups', 'admin', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      // Revert back from 'super_admin' ➝ 'admin'
      queryInterface.renameColumn('groups', 'super_admin', 'admin'),
    ]);
  },
};
