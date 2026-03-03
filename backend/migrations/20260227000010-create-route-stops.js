'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('route_stops', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            assignment_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'assignments', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'orders', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            sequence_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'ARRIVED', 'COMPLETED', 'SKIPPED'),
                defaultValue: 'PENDING',
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

        await queryInterface.addIndex('route_stops', ['assignment_id', 'sequence_number']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('route_stops');
    },
};
