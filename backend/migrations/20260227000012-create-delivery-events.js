'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('delivery_events', {
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
            event_type: {
                type: Sequelize.ENUM('ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'DELIVERED', 'FAILED', 'RETURNED'),
                allowNull: false,
            },
            timestamp: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            photo_url: {
                type: Sequelize.STRING(500),
                allowNull: true,
            },
        });

        await queryInterface.addIndex('delivery_events', ['assignment_id'], {
            name: 'idx_delivery_events_assignment',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('delivery_events');
    },
};
