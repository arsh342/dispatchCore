'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('companies', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('companies', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('companies', 'location', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('companies', 'contact_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('companies', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addIndex('companies', ['email'], {
      unique: true,
      name: 'companies_email_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('companies', 'companies_email_unique');
    await queryInterface.removeColumn('companies', 'phone');
    await queryInterface.removeColumn('companies', 'contact_name');
    await queryInterface.removeColumn('companies', 'location');
    await queryInterface.removeColumn('companies', 'password_hash');
    await queryInterface.removeColumn('companies', 'email');
  },
};
