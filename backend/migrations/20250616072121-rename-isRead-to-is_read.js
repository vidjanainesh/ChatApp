'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Messages', 'isRead', 'is_read');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Messages', 'is_read', 'isRead');
  },
};
