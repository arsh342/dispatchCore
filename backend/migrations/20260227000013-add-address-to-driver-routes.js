'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('driver_routes', 'start_address', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('driver_routes', 'end_address', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('driver_routes', 'start_address');
    await queryInterface.removeColumn('driver_routes', 'end_address');
  },
};
