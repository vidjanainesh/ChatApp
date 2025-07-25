'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'profile_image_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'profile_image_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'profile_image_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'profile_image_size', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'profile_image_blur_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'profile_image_blur_width', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'profile_image_blur_height', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'profile_image_url');
    await queryInterface.removeColumn('users', 'profile_image_type');
    await queryInterface.removeColumn('users', 'profile_image_name');
    await queryInterface.removeColumn('users', 'profile_image_size');
    await queryInterface.removeColumn('users', 'profile_image_blur_url');
    await queryInterface.removeColumn('users', 'profile_image_blur_width');
    await queryInterface.removeColumn('users', 'profile_image_blur_height');
  }
};