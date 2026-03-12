'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('drivers', 'name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('drivers', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('drivers', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn('drivers', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE drivers d
      LEFT JOIN users u ON u.id = d.user_id
      SET
        d.name = COALESCE(d.name, u.name),
        d.email = COALESCE(d.email, u.email),
        d.phone = COALESCE(d.phone, u.phone)
    `);

    await queryInterface.changeColumn('drivers', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('drivers', ['email'], {
      unique: true,
      name: 'drivers_email_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('drivers', 'drivers_email_unique');

    await queryInterface.changeColumn('drivers', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.removeColumn('drivers', 'password_hash');
    await queryInterface.removeColumn('drivers', 'phone');
    await queryInterface.removeColumn('drivers', 'email');
    await queryInterface.removeColumn('drivers', 'name');
  },
};
