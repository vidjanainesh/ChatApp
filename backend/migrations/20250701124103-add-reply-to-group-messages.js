'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('group_messages', 'reply_to', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'group_messages',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('group_messages', 'reply_to');
  }
};