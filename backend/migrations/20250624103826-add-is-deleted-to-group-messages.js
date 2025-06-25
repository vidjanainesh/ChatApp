"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("group_messages", "is_deleted", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("group_messages", "is_deleted");
  },
};