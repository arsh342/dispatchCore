'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('bids', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
            offered_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'),
                defaultValue: 'PENDING',
                allowNull: false,
            },
            message: {
                type: Sequelize.STRING(500),
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

        await queryInterface.addIndex('bids', ['order_id', 'status'], {
            name: 'idx_bids_order_status',
        });
        await queryInterface.addIndex('bids', ['driver_id']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('bids');
    },
};
