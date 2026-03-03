'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('orders', {
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
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            tracking_code: {
                type: Sequelize.STRING(36),
                allowNull: false,
                unique: true,
            },
            status: {
                type: Sequelize.ENUM(
                    'UNASSIGNED',
                    'LISTED',
                    'ASSIGNED',
                    'PICKED_UP',
                    'EN_ROUTE',
                    'DELIVERED',
                    'CANCELLED',
                ),
                defaultValue: 'UNASSIGNED',
                allowNull: false,
            },
            listed_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            weight_kg: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true,
            },
            pickup_lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            pickup_lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            pickup_address: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            delivery_lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            delivery_lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false,
            },
            delivery_address: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            priority: {
                type: Sequelize.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
                defaultValue: 'NORMAL',
                allowNull: false,
            },
            notes: {
                type: Sequelize.TEXT,
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

        await queryInterface.addIndex('orders', ['company_id', 'status'], {
            name: 'idx_orders_company_status',
        });
        await queryInterface.addIndex('orders', ['customer_id']);
        await queryInterface.addIndex('orders', ['status']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('orders');
    },
};
