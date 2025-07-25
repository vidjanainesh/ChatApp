'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'dob', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'gender');
    await queryInterface.removeColumn('users', 'dob');
    await queryInterface.removeColumn('users', 'address');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_gender";');
  }
};
