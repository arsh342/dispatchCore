/**
 * Message Model
 *
 * Stores chat messages between dispatchers, drivers, and recipients.
 * Each message is scoped to a specific order (the shared context).
 *
 * Participant types:
 *   dispatcher — company dispatcher (sender_id = user.id)
 *   driver     — assigned driver    (sender_id = driver.id)
 *   recipient  — delivery recipient (identified by order tracking_code, no DB user)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define(
    'Message',
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
      channel: {
        type: DataTypes.ENUM('dispatcher-driver', 'dispatcher-recipient', 'driver-recipient'),
        allowNull: false,
        comment: 'Identifies the 1-on-1 chat pair within an order',
      },
      sender_type: {
        type: DataTypes.ENUM('dispatcher', 'driver', 'recipient'),
        allowNull: false,
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'user.id for dispatcher, driver.id for driver, null for recipient',
      },
      sender_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      tableName: 'messages',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['order_id', 'channel', 'created_at'], name: 'idx_messages_order_channel_time' },
        { fields: ['sender_type', 'sender_id'], name: 'idx_messages_sender' },
      ],
    },
  );

  Message.associate = (models) => {
    Message.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
  };

  return Message;
};
