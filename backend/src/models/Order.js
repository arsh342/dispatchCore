/**
 * Order Model
 *
 * Delivery requests created by dispatchers. The core entity of the system.
 *
 * Status lifecycle:
 *   UNASSIGNED → ASSIGNED (direct) → PICKED_UP → EN_ROUTE → DELIVERED
 *   UNASSIGNED → LISTED (marketplace) → ASSIGNED (bid accepted) → ...
 *   Any → CANCELLED
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define(
        'Order',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            company_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' },
            },
            customer_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
            },
            tracking_code: {
                type: DataTypes.STRING(36),
                allowNull: false,
                unique: true,
            },
            status: {
                type: DataTypes.ENUM(
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
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            weight_kg: {
                type: DataTypes.DECIMAL(8, 2),
                allowNull: true,
                validate: { min: 0 },
            },
            pickup_lat: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -90, max: 90 },
            },
            pickup_lng: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -180, max: 180 },
            },
            pickup_address: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            delivery_lat: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -90, max: 90 },
            },
            delivery_lng: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -180, max: 180 },
            },
            delivery_address: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            priority: {
                type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
                defaultValue: 'NORMAL',
                allowNull: false,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: 'orders',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['company_id', 'status'], name: 'idx_orders_company_status' },
                { fields: ['tracking_code'], unique: true, name: 'idx_orders_tracking_code' },
                { fields: ['customer_id'] },
                { fields: ['status'] },
            ],
        },
    );

    Order.associate = (models) => {
        Order.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
        Order.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
        Order.hasMany(models.Bid, { foreignKey: 'order_id', as: 'bids' });
        Order.hasOne(models.Assignment, { foreignKey: 'order_id', as: 'assignment' });
    };

    return Order;
};
