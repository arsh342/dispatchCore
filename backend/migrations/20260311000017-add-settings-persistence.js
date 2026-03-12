'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('companies', 'notification_preferences', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('companies', 'appearance_preferences', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('drivers', 'notification_preferences', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('drivers', 'appearance_preferences', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.changeColumn('vehicles', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'companies', key: 'id' },
    });

    await queryInterface.createTable('superadmin_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Platform Admin',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'admin@dispatchcore.com',
      },
      notification_preferences: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      appearance_preferences: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('superadmin_settings');

    await queryInterface.changeColumn('vehicles', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'companies', key: 'id' },
    });

    await queryInterface.removeColumn('drivers', 'appearance_preferences');
    await queryInterface.removeColumn('drivers', 'notification_preferences');
    await queryInterface.removeColumn('companies', 'appearance_preferences');
    await queryInterface.removeColumn('companies', 'notification_preferences');
  },
};
