'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'messages';
    const table = await queryInterface.describeTable(tableName);

    if (!table.channel) {
      await queryInterface.addColumn(tableName, 'channel', {
        type: Sequelize.ENUM('dispatcher-driver', 'dispatcher-recipient', 'driver-recipient'),
        allowNull: false,
        defaultValue: 'dispatcher-driver',
        comment: 'Identifies the 1-on-1 chat pair within an order',
        after: 'order_id',
      });
    }

    // Ensure index used by conversation queries exists.
    const existingIndexes = await queryInterface.showIndex(tableName);
    const hasOrderChannelTimeIndex = existingIndexes.some(
      (index) => index.name === 'idx_messages_order_channel_time',
    );

    if (!hasOrderChannelTimeIndex) {
      await queryInterface.addIndex(tableName, ['order_id', 'channel', 'created_at'], {
        name: 'idx_messages_order_channel_time',
      });
    }
  },

  async down(queryInterface) {
    const tableName = 'messages';

    const existingIndexes = await queryInterface.showIndex(tableName);
    const hasOrderChannelTimeIndex = existingIndexes.some(
      (index) => index.name === 'idx_messages_order_channel_time',
    );

    if (hasOrderChannelTimeIndex) {
      await queryInterface.removeIndex(tableName, 'idx_messages_order_channel_time');
    }

    const table = await queryInterface.describeTable(tableName);
    if (table.channel) {
      await queryInterface.removeColumn(tableName, 'channel');
    }
  },
};
