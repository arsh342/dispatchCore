'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('assignments', 'assigned_by_company_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'companies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addIndex('assignments', ['assigned_by_company_id'], {
      name: 'idx_assignments_assigned_by_company',
    });

    await queryInterface.sequelize.query(`
      UPDATE assignments a
      INNER JOIN orders o ON o.id = a.order_id
      SET a.assigned_by_company_id = o.company_id
      WHERE a.assigned_by_company_id IS NULL
    `);

    await queryInterface.changeColumn('assignments', 'assigned_by_company_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'companies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.removeColumn('assignments', 'assigned_by');
    await queryInterface.removeColumn('orders', 'customer_id');
    await queryInterface.removeColumn('drivers', 'user_id');
    await queryInterface.dropTable('users');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('superadmin', 'dispatcher', 'customer'),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addColumn('drivers', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('orders', 'customer_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('assignments', 'assigned_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.removeIndex('assignments', 'idx_assignments_assigned_by_company');
    await queryInterface.removeColumn('assignments', 'assigned_by_company_id');
  },
};
