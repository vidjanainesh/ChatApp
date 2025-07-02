'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('messages', 'reply_to', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('messages', 'reply_to');
  }
};