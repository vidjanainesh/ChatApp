'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add `is_edited` to messages
    await queryInterface.addColumn('messages', 'is_edited', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Add `is_edited` to group_messages
    await queryInterface.addColumn('group_messages', 'is_edited', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove `is_edited` from messages
    await queryInterface.removeColumn('messages', 'is_edited');

    // Remove `is_edited` from group_messages
    await queryInterface.removeColumn('group_messages', 'is_edited');
  }
};