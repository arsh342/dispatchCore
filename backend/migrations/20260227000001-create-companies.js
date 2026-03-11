'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('companies', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            plan_type: {
                type: Sequelize.ENUM('STARTER', 'GROWTH', 'ENTERPRISE'),
                defaultValue: 'STARTER',
                allowNull: false,
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
    },

    async down(queryInterface) {
        await queryInterface.dropTable('companies');
    },
};
