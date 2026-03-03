/**
 * DriverRoute Model
 *
 * Independent drivers pre-register their travel plans so dispatchers
 * can proactively match them with packages heading the same direction.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DriverRoute = sequelize.define(
        'DriverRoute',
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
            start_lat: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -90, max: 90 },
            },
            start_lng: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -180, max: 180 },
            },
            end_lat: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -90, max: 90 },
            },
            end_lng: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -180, max: 180 },
            },
            departure_time: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
        },
        {
            tableName: 'driver_routes',
            timestamps: true,
            underscored: true,
            indexes: [{ fields: ['is_active', 'departure_time'] }, { fields: ['driver_id'] }],
        },
    );

    DriverRoute.associate = (models) => {
        DriverRoute.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
    };

    return DriverRoute;
};
