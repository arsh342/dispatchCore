/**
 * Bid Model
 *
 * Independent driver counter-offers on marketplace-listed orders.
 * Bids are streamed to dispatchers in real-time via WebSocket.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Bid = sequelize.define(
        'Bid',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'orders', key: 'id' },
            },
            driver_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'drivers', key: 'id' },
            },
            offered_price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: { min: 0.01 },
            },
            status: {
                type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'),
                defaultValue: 'PENDING',
                allowNull: false,
            },
            message: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
        },
        {
            tableName: 'bids',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['order_id', 'status'], name: 'idx_bids_order_status' },
                { fields: ['driver_id'] },
            ],
        },
    );

    Bid.associate = (models) => {
        Bid.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
        Bid.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
    };

    return Bid;
};
