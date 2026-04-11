'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'orders';
    const table = await queryInterface.describeTable(tableName);

    if (!table.recipient_name) {
      await queryInterface.addColumn(tableName, 'recipient_name', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!table.recipient_phone) {
      await queryInterface.addColumn(tableName, 'recipient_phone', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (!table.recipient_email) {
      await queryInterface.addColumn(tableName, 'recipient_email', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableName = 'orders';
    const table = await queryInterface.describeTable(tableName);

    if (table.recipient_email) {
      await queryInterface.removeColumn(tableName, 'recipient_email');
    }

    if (table.recipient_phone) {
      await queryInterface.removeColumn(tableName, 'recipient_phone');
    }

    if (table.recipient_name) {
      await queryInterface.removeColumn(tableName, 'recipient_name');
    }
  },
};
