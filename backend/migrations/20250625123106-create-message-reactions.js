'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('message_reactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // name of your Users table
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      target_type: {
        type: Sequelize.ENUM('private', 'group'),
        allowNull: false
      },
      reaction: {
        type: Sequelize.STRING,
        allowNull: false
        // optionally: validate values (👍, ❤️, 😂, etc.) at application level
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('message_reactions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_message_reactions_target_type";');
  }
};