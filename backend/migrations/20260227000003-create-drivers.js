'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('drivers', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            type: {
                type: Sequelize.ENUM('EMPLOYED', 'INDEPENDENT'),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('AVAILABLE', 'BUSY', 'OFFLINE'),
                defaultValue: 'OFFLINE',
                allowNull: false,
            },
            verification_status: {
                type: Sequelize.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
                defaultValue: 'PENDING',
                allowNull: false,
            },
            license_number: {
                type: Sequelize.STRING(50),
                allowNull: true,
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

        await queryInterface.addIndex('drivers', ['company_id', 'status']);
        await queryInterface.addIndex('drivers', ['type', 'status']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('drivers');
    },
};
