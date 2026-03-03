'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('driver_routes', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            driver_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'drivers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            start_lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            start_lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            end_lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            end_lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            departure_time: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
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

        await queryInterface.addIndex('driver_routes', ['is_active', 'departure_time']);
        await queryInterface.addIndex('driver_routes', ['driver_id']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('driver_routes');
    },
};
