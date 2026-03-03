/**
 * RouteStop Model
 *
 * Individual stops within a batched multi-stop delivery assignment.
 * Ordered by sequence_number for driver navigation.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RouteStop = sequelize.define(
        'RouteStop',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            assignment_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'assignments', key: 'id' },
            },
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'orders', key: 'id' },
            },
            sequence_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            lat: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -90, max: 90 },
            },
            lng: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -180, max: 180 },
            },
            status: {
                type: DataTypes.ENUM('PENDING', 'ARRIVED', 'COMPLETED', 'SKIPPED'),
                defaultValue: 'PENDING',
                allowNull: false,
            },
        },
        {
            tableName: 'route_stops',
            timestamps: true,
            underscored: true,
            indexes: [{ fields: ['assignment_id', 'sequence_number'] }],
        },
    );

    RouteStop.associate = (models) => {
        RouteStop.belongsTo(models.Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
        RouteStop.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    };

    return RouteStop;
};
