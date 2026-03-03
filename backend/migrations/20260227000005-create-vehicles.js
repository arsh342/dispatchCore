'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('vehicles', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            driver_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'drivers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            plate_number: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true,
            },
            type: {
                type: Sequelize.ENUM('BIKE', 'VAN', 'TRUCK'),
                allowNull: false,
            },
            capacity_kg: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'MAINTENANCE', 'RETIRED'),
                defaultValue: 'ACTIVE',
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

        await queryInterface.addIndex('vehicles', ['company_id', 'status']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('vehicles');
    },
};
