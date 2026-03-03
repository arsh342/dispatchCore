/**
 * DriverLocationLog Model
 *
 * High-frequency GPS pings from driver devices.
 * Used for live tracking and historical route playback.
 *
 * This table will grow rapidly — designed for future
 * time-based partitioning (monthly) in CE-02.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DriverLocationLog = sequelize.define(
        'DriverLocationLog',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            driver_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'drivers', key: 'id' },
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
            speed: {
                type: DataTypes.DECIMAL(6, 2),
                allowNull: true,
                validate: { min: 0 },
            },
            heading: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
                validate: { min: 0, max: 360 },
            },
            recorded_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'driver_location_logs',
            timestamps: false, // uses recorded_at instead
            underscored: true,
            indexes: [
                {
                    fields: ['driver_id', 'recorded_at'],
                    name: 'idx_location_logs_driver_time',
                },
            ],
        },
    );

    DriverLocationLog.associate = (models) => {
        DriverLocationLog.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
    };

    return DriverLocationLog;
};
