'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add 'type' column
    await queryInterface.addColumn('group_messages', 'type', {
      type: Sequelize.ENUM('text', 'system'),
      allowNull: false,
      defaultValue: 'text',
    });

    // 2. Make 'sender_id' nullable
    await queryInterface.changeColumn('group_messages', 'sender_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Revert 'sender_id' to NOT NULL (if needed)
    await queryInterface.changeColumn('group_messages', 'sender_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // 2. Remove 'type' column and enum
    await queryInterface.removeColumn('group_messages', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_messages_type";');
  }
};
