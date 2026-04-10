'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('drivers');

    if (!table.name) {
      await queryInterface.addColumn('drivers', 'name', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!table.email) {
      await queryInterface.addColumn('drivers', 'email', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!table.phone) {
      await queryInterface.addColumn('drivers', 'phone', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (!table.password_hash) {
      await queryInterface.addColumn('drivers', 'password_hash', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE drivers d
      LEFT JOIN users u ON u.id = d.user_id
      SET
        d.name = COALESCE(d.name, u.name),
        d.email = COALESCE(d.email, u.email),
        d.phone = COALESCE(d.phone, u.phone)
    `);

    // Keep user_id nullable so we can safely transition away from users-table coupling.
    // Do not re-attach a SET NULL FK here because MySQL can fail when replaying on partially
    // migrated schemas where the legacy FK/NULLability state diverges.
    await queryInterface.changeColumn('drivers', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
    });

    const [existingIndexes] = await queryInterface.sequelize.query(
      `
      SHOW INDEX FROM drivers
      WHERE Key_name = 'drivers_email_unique'
      `,
    );

    if (!existingIndexes || existingIndexes.length === 0) {
      await queryInterface.addIndex('drivers', ['email'], {
        unique: true,
        name: 'drivers_email_unique',
      });
    }
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
