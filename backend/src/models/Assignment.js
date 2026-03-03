/**
 * Assignment Model
 *
 * Links a driver + vehicle to an order. Created either by direct
 * dispatcher assignment or by accepting a marketplace bid.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Assignment = sequelize.define(
        'Assignment',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true, // one assignment per order
                references: { model: 'orders', key: 'id' },
            },
            driver_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'drivers', key: 'id' },
            },
            vehicle_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'vehicles', key: 'id' },
            },
            assigned_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
            },
            source: {
                type: DataTypes.ENUM('DIRECT', 'BID'),
                allowNull: false,
            },
            estimated_arrival: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: 'assignments',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['driver_id', 'created_at'], name: 'idx_assignments_driver_created' },
                { fields: ['order_id'], unique: true },
            ],
        },
    );

    Assignment.associate = (models) => {
        Assignment.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
        Assignment.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
        Assignment.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
        Assignment.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'assignedByUser' });
        Assignment.hasMany(models.RouteStop, { foreignKey: 'assignment_id', as: 'routeStops' });
        Assignment.hasMany(models.DeliveryEvent, { foreignKey: 'assignment_id', as: 'events' });
    };

    return Assignment;
};
