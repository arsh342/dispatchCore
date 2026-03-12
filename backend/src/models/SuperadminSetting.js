const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SuperadminSetting = sequelize.define(
        'SuperadminSetting',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: 'Platform Admin',
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                defaultValue: 'admin@dispatchcore.com',
                validate: {
                    isEmail: { msg: 'Must be a valid email address' },
                },
            },
            notification_preferences: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            appearance_preferences: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            tableName: 'superadmin_settings',
            timestamps: true,
            underscored: true,
        },
    );

    return SuperadminSetting;
};
