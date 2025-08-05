'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      // Rename 'admin' ➝ 'super_admin'
      queryInterface.renameColumn('groups', 'admin', 'super_admin'),

    ]);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      // Revert back from 'super_admin' ➝ 'admin'
      queryInterface.renameColumn('groups', 'super_admin', 'admin'),
    ]);
  },
};
