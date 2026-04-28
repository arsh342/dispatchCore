'use strict';

/**
 * Migration: Add Firebase UID column and UNIQUE constraint on phone
 *
 * Enables Firebase Auth integration:
 *   - firebase_uid: links MySQL user to Firebase Auth user (set on first login)
 *   - UNIQUE phone: required for phone-number authentication lookups
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Drivers ──

    // Add firebase_uid column
    await queryInterface.addColumn('drivers', 'firebase_uid', {
      type: Sequelize.STRING(128),
      allowNull: true,
      unique: true,
      after: 'id',
    });

    // Remove existing non-unique phone index if any, then add unique
    try {
      await queryInterface.removeIndex('drivers', ['phone']);
    } catch {
      // Index may not exist — safe to ignore
    }

    await queryInterface.addIndex('drivers', ['phone'], {
      unique: true,
      name: 'idx_drivers_phone_unique',
      where: { phone: { [Sequelize.Op.ne]: null } },
    });

    // ── Companies ──

    // Add firebase_uid column
    await queryInterface.addColumn('companies', 'firebase_uid', {
      type: Sequelize.STRING(128),
      allowNull: true,
      unique: true,
      after: 'id',
    });

    // Add unique phone index
    try {
      await queryInterface.removeIndex('companies', ['phone']);
    } catch {
      // Index may not exist — safe to ignore
    }

    await queryInterface.addIndex('companies', ['phone'], {
      unique: true,
      name: 'idx_companies_phone_unique',
      where: { phone: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    // ── Drivers ──
    await queryInterface.removeIndex('drivers', 'idx_drivers_phone_unique');
    await queryInterface.removeColumn('drivers', 'firebase_uid');

    // ── Companies ──
    await queryInterface.removeIndex('companies', 'idx_companies_phone_unique');
    await queryInterface.removeColumn('companies', 'firebase_uid');
  },
};
