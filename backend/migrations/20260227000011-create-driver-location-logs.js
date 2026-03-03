'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('driver_location_logs', {
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
            lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            speed: {
                type: Sequelize.DECIMAL(6, 2),
                allowNull: true,
            },
            heading: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
            },
            recorded_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        await queryInterface.addIndex('driver_location_logs', ['driver_id', 'recorded_at'], {
            name: 'idx_location_logs_driver_time',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('driver_location_logs');
    },
};
