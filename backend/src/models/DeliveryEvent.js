/**
 * DeliveryEvent Model
 *
 * Status transition audit log for assignments.
 * Every status change (ASSIGNED → PICKED_UP → EN_ROUTE → DELIVERED)
 * is recorded as an immutable event with a timestamp and optional notes.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DeliveryEvent = sequelize.define(
        'DeliveryEvent',
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
            event_type: {
                type: DataTypes.ENUM('ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'DELIVERED', 'FAILED', 'RETURNED'),
                allowNull: false,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            photo_url: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
        },
        {
            tableName: 'delivery_events',
            timestamps: false, // uses custom timestamp field
            underscored: true,
            indexes: [{ fields: ['assignment_id'], name: 'idx_delivery_events_assignment' }],
        },
    );

    DeliveryEvent.associate = (models) => {
        DeliveryEvent.belongsTo(models.Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
    };

    return DeliveryEvent;
};
