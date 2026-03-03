'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('assignments', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: { model: 'orders', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            driver_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'drivers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            vehicle_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'vehicles', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            assigned_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            source: {
                type: Sequelize.ENUM('DIRECT', 'BID'),
                allowNull: false,
            },
            estimated_arrival: {
                type: Sequelize.DATE,
                allowNull: true,
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

        await queryInterface.addIndex('assignments', ['driver_id', 'created_at'], {
            name: 'idx_assignments_driver_created',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('assignments');
    },
};
